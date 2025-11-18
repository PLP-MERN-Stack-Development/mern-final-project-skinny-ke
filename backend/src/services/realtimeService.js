import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.workspaceRooms = new Map(); // workspaceId -> Set of socketIds
    this.typingUsers = new Map(); // taskId -> Set of userIds currently typing
    this.rateLimiters = new Map(); // socketId -> rate limit data
  }

  initialize(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupCleanup();

    logger.info('🔌 Real-time service initialized');
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user._id.toString();

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const socketId = socket.id;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxEvents = 100; // 100 events per minute

      if (!this.rateLimiters.has(socketId)) {
        this.rateLimiters.set(socketId, {
          events: [],
          blocked: false
        });
      }

      const limiter = this.rateLimiters.get(socketId);

      // Remove old events outside the window
      limiter.events = limiter.events.filter(time => now - time < windowMs);

      // Check if rate limit exceeded
      if (limiter.events.length >= maxEvents) {
        limiter.blocked = true;
        logger.warn(`Rate limit exceeded for socket ${socketId}`);
        return next(new Error('Rate limit exceeded'));
      }

      // Add current event
      limiter.events.push(now);
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      const user = socket.user;

      logger.info(`🔌 User ${user.firstName} ${user.lastName} (${userId}) connected`);

      // Track connected user
      this.connectedUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, userId);

      // Update user online status
      this.updateUserPresence(userId, true);

      // Handle workspace joining
      socket.on('workspace:join', (workspaceId) => {
        this.handleWorkspaceJoin(socket, workspaceId);
      });

      socket.on('workspace:leave', (workspaceId) => {
        this.handleWorkspaceLeave(socket, workspaceId);
      });

      // Handle task events
      socket.on('task:update', (data) => {
        this.handleTaskUpdate(socket, data);
      });

      socket.on('task:create', (data) => {
        this.handleTaskCreate(socket, data);
      });

      socket.on('task:delete', (data) => {
        this.handleTaskDelete(socket, data);
      });

      // Handle comment events
      socket.on('comment:create', (data) => {
        this.handleCommentCreate(socket, data);
      });

      socket.on('comment:update', (data) => {
        this.handleCommentUpdate(socket, data);
      });

      socket.on('comment:delete', (data) => {
        this.handleCommentDelete(socket, data);
      });

      socket.on('comment:reaction', (data) => {
        this.handleCommentReaction(socket, data);
      });

      // Handle typing indicators
      socket.on('typing:start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing:stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle presence updates
      socket.on('presence:request', () => {
        this.handlePresenceRequest(socket);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send welcome message
      socket.emit('connected', {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar
        },
        timestamp: new Date()
      });
    });
  }

  setupCleanup() {
    // Clean up rate limiters periodically
    setInterval(() => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute

      for (const [socketId, limiter] of this.rateLimiters) {
        // Remove old events
        limiter.events = limiter.events.filter(time => now - time < windowMs);

        // Remove limiter if no recent activity and not connected
        if (limiter.events.length === 0 && !this.userSockets.has(socketId)) {
          this.rateLimiters.delete(socketId);
        }
      }
    }, 30000); // Clean up every 30 seconds
  }

  async handleWorkspaceJoin(socket, workspaceId) {
    try {
      const userId = socket.userId;

      // Verify user is a member of the workspace
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.isMember(userId)) {
        socket.emit('error', { message: 'Access denied to workspace' });
        return;
      }

      // Join workspace room
      socket.join(`workspace:${workspaceId}`);

      // Track workspace membership
      if (!this.workspaceRooms.has(workspaceId)) {
        this.workspaceRooms.set(workspaceId, new Set());
      }
      this.workspaceRooms.get(workspaceId).add(socket.id);

      // Send workspace info
      socket.emit('workspace:joined', {
        workspaceId,
        members: await this.getWorkspacePresence(workspaceId)
      });

      logger.info(`User ${userId} joined workspace ${workspaceId}`);
    } catch (error) {
      logger.error('Error joining workspace:', error);
      socket.emit('error', { message: 'Failed to join workspace' });
    }
  }

  async handleWorkspaceLeave(socket, workspaceId) {
    socket.leave(`workspace:${workspaceId}`);

    // Remove from tracking
    if (this.workspaceRooms.has(workspaceId)) {
      this.workspaceRooms.get(workspaceId).delete(socket.id);
    }

    logger.info(`User ${socket.userId} left workspace ${workspaceId}`);
  }

  async handleTaskUpdate(socket, data) {
    try {
      const { taskId, updates, workspaceId } = data;
      const userId = socket.userId;

      // Verify task exists and user has access
      const task = await Task.findById(taskId);
      if (!task || !(await task.canAccess(userId))) {
        socket.emit('error', { message: 'Task access denied' });
        return;
      }

      // Apply updates
      Object.assign(task, updates);
      await task.save();

      // Log activity
      if (updates.status) {
        await task.logActivity('status_changed', userId, {}, task.status, updates.status);
      }

      // Broadcast to workspace
      this.io.to(`workspace:${workspaceId}`).emit('task:updated', {
        taskId,
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });

      logger.info(`Task ${taskId} updated by user ${userId}`);
    } catch (error) {
      logger.error('Error updating task:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  }

  async handleTaskCreate(socket, data) {
    try {
      const { workspaceId, taskData } = data;
      const userId = socket.userId;

      // Verify workspace access
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.isMember(userId)) {
        socket.emit('error', { message: 'Workspace access denied' });
        return;
      }

      // Create task
      const task = await Task.create({
        ...taskData,
        workspace: workspaceId,
        createdBy: userId
      });

      // Log activity
      await task.logActivity('created', userId);

      // Broadcast to workspace
      this.io.to(`workspace:${workspaceId}`).emit('task:created', {
        task: await task.toDetailedJSON(),
        createdBy: userId,
        timestamp: new Date()
      });

      logger.info(`Task ${task._id} created by user ${userId}`);
    } catch (error) {
      logger.error('Error creating task:', error);
      socket.emit('error', { message: 'Failed to create task' });
    }
  }

  async handleTaskDelete(socket, data) {
    try {
      const { taskId, workspaceId } = data;
      const userId = socket.userId;

      // Verify task exists and user has access
      const task = await Task.findById(taskId);
      if (!task || !(await task.canAccess(userId))) {
        socket.emit('error', { message: 'Task access denied' });
        return;
      }

      // Archive task
      await task.archive(userId);

      // Broadcast to workspace
      this.io.to(`workspace:${workspaceId}`).emit('task:deleted', {
        taskId,
        deletedBy: userId,
        timestamp: new Date()
      });

      logger.info(`Task ${taskId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting task:', error);
      socket.emit('error', { message: 'Failed to delete task' });
    }
  }

  async handleCommentCreate(socket, data) {
    try {
      const { taskId, content, mentions = [] } = data;
      const userId = socket.userId;

      // Verify task access
      const task = await Task.findById(taskId);
      if (!task || !(await task.canAccess(userId))) {
        socket.emit('error', { message: 'Task access denied' });
        return;
      }

      // Create comment
      const comment = await Comment.create({
        content,
        author: userId,
        task: taskId,
        mentions
      });

      // Add to task
      await task.comments.push(comment._id);
      await task.save();

      // Populate comment
      await comment.populate([
        { path: 'author', select: 'firstName lastName email avatar' },
        { path: 'mentions', select: 'firstName lastName username' }
      ]);

      // Broadcast to workspace
      this.io.to(`workspace:${task.workspace}`).emit('comment:created', {
        comment: await comment.toDetailedJSON(),
        taskId,
        createdBy: userId,
        timestamp: new Date()
      });

      // Send notifications to mentioned users
      for (const mention of mentions) {
        if (mention !== userId) {
          this.sendNotification(mention, {
            type: 'mention',
            title: 'You were mentioned in a comment',
            message: `${socket.user.firstName} mentioned you in a task comment`,
            data: { taskId, commentId: comment._id }
          });
        }
      }

      logger.info(`Comment ${comment._id} created by user ${userId}`);
    } catch (error) {
      logger.error('Error creating comment:', error);
      socket.emit('error', { message: 'Failed to create comment' });
    }
  }

  async handleCommentUpdate(socket, data) {
    try {
      const { commentId, content } = data;
      const userId = socket.userId;

      // Find and update comment
      const comment = await Comment.findById(commentId);
      if (!comment || comment.author.toString() !== userId) {
        socket.emit('error', { message: 'Comment access denied' });
        return;
      }

      await comment.edit(content, userId);

      // Populate updated comment
      await comment.populate([
        { path: 'author', select: 'firstName lastName email avatar' },
        { path: 'mentions', select: 'firstName lastName username' }
      ]);

      // Broadcast to workspace
      const task = await Task.findById(comment.task);
      this.io.to(`workspace:${task.workspace}`).emit('comment:updated', {
        comment: await comment.toDetailedJSON(),
        taskId: comment.task,
        updatedBy: userId,
        timestamp: new Date()
      });

      logger.info(`Comment ${commentId} updated by user ${userId}`);
    } catch (error) {
      logger.error('Error updating comment:', error);
      socket.emit('error', { message: 'Failed to update comment' });
    }
  }

  async handleCommentDelete(socket, data) {
    try {
      const { commentId } = data;
      const userId = socket.userId;

      // Find and soft delete comment
      const comment = await Comment.findById(commentId);
      if (!comment || comment.author.toString() !== userId) {
        socket.emit('error', { message: 'Comment access denied' });
        return;
      }

      await comment.softDelete(userId);

      // Broadcast to workspace
      const task = await Task.findById(comment.task);
      this.io.to(`workspace:${task.workspace}`).emit('comment:deleted', {
        commentId,
        taskId: comment.task,
        deletedBy: userId,
        timestamp: new Date()
      });

      logger.info(`Comment ${commentId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting comment:', error);
      socket.emit('error', { message: 'Failed to delete comment' });
    }
  }

  async handleCommentReaction(socket, data) {
    try {
      const { commentId, emoji, action } = data; // action: 'add' or 'remove'
      const userId = socket.userId;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        socket.emit('error', { message: 'Comment not found' });
        return;
      }

      if (action === 'add') {
        await comment.addReaction(userId, emoji);
      } else if (action === 'remove') {
        await comment.removeReaction(userId, emoji);
      }

      // Broadcast to workspace
      const task = await Task.findById(comment.task);
      this.io.to(`workspace:${task.workspace}`).emit('comment:reaction', {
        commentId,
        taskId: comment.task,
        reaction: { user: userId, emoji, action },
        timestamp: new Date()
      });

      logger.info(`Reaction ${action} on comment ${commentId} by user ${userId}`);
    } catch (error) {
      logger.error('Error handling comment reaction:', error);
      socket.emit('error', { message: 'Failed to update reaction' });
    }
  }

  handleTypingStart(socket, data) {
    const { taskId } = data;
    const userId = socket.userId;

    // Track typing users
    if (!this.typingUsers.has(taskId)) {
      this.typingUsers.set(taskId, new Set());
    }
    this.typingUsers.get(taskId).add(userId);

    // Broadcast typing indicator
    socket.to(`workspace:*`).emit('typing:start', {
      taskId,
      userId,
      user: {
        _id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      }
    });

    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, { taskId });
    }, 3000);
  }

  handleTypingStop(socket, data) {
    const { taskId } = data;
    const userId = socket.userId;

    // Remove from typing users
    if (this.typingUsers.has(taskId)) {
      this.typingUsers.get(taskId).delete(userId);

      // Broadcast typing stopped
      socket.to(`workspace:*`).emit('typing:stop', {
        taskId,
        userId
      });
    }
  }

  async handlePresenceRequest(socket) {
    const userId = socket.userId;

    // Get user's workspaces
    const workspaces = await Workspace.findUserWorkspaces(userId);

    // Send presence info for each workspace
    for (const workspace of workspaces) {
      const presence = await this.getWorkspacePresence(workspace._id);
      socket.emit('presence:update', {
        workspaceId: workspace._id,
        presence
      });
    }
  }

  async handleDisconnect(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    logger.info(`🔌 User ${userId} disconnected`);

    // Remove from connected users
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socketId);

    // Update user offline status
    this.updateUserPresence(userId, false);

    // Clean up workspace rooms
    for (const [workspaceId, sockets] of this.workspaceRooms) {
      sockets.delete(socketId);
    }

    // Clean up typing indicators
    for (const [taskId, users] of this.typingUsers) {
      users.delete(userId);
    }

    // Clean up rate limiter
    this.rateLimiters.delete(socketId);
  }

  async updateUserPresence(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastActive: new Date()
      });

      // Broadcast presence update to all user's workspaces
      const workspaces = await Workspace.findUserWorkspaces(userId);
      for (const workspace of workspaces) {
        this.io.to(`workspace:${workspace._id}`).emit('user:presence', {
          userId,
          isOnline,
          lastActive: new Date()
        });
      }
    } catch (error) {
      logger.error('Error updating user presence:', error);
    }
  }

  async getWorkspacePresence(workspaceId) {
    try {
      const workspace = await Workspace.findById(workspaceId)
        .populate('members.user', 'firstName lastName email avatar isOnline lastActive');

      return workspace.members.map(member => ({
        user: {
          _id: member.user._id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastActive: member.user.lastActive
        },
        role: member.role,
        joinedAt: member.joinedAt
      }));
    } catch (error) {
      logger.error('Error getting workspace presence:', error);
      return [];
    }
  }

  sendNotification(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date()
      });
    }
  }

  // Public methods for external use
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getWorkspaceOnlineUsers(workspaceId) {
    const onlineUsers = [];
    if (this.workspaceRooms.has(workspaceId)) {
      for (const socketId of this.workspaceRooms.get(workspaceId)) {
        const userId = this.userSockets.get(socketId);
        if (userId) {
          onlineUsers.push(userId);
        }
      }
    }
    return [...new Set(onlineUsers)]; // Remove duplicates
  }

  // Broadcast to workspace
  broadcastToWorkspace(workspaceId, event, data) {
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Send to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;