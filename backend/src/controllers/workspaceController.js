import { validationResult } from 'express-validator';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  notFoundResponse
} from '../utils/response.js';
import logger from '../utils/logger.js';

// @desc    Get all workspaces for authenticated user
// @route   GET /api/v1/workspaces
// @access  Private
export const getWorkspaces = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { includeArchived = false } = req.query;

  const workspaces = await Workspace.findUserWorkspaces(userId, includeArchived);

  // Add membership info for each workspace
  const workspacesWithMembership = workspaces.map(workspace =>
    workspace.toPublicProfile(userId)
  );

  successResponse(res, 'Workspaces retrieved successfully', {
    workspaces: workspacesWithMembership,
    count: workspacesWithMembership.length
  });
});

// @desc    Get single workspace
// @route   GET /api/v1/workspaces/:workspaceId
// @access  Private (Workspace Member)
export const getWorkspace = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is a member
  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  successResponse(res, 'Workspace retrieved successfully', {
    workspace: workspace.toPublicProfile(userId)
  });
});

// @desc    Create new workspace
// @route   POST /api/v1/workspaces
// @access  Private
export const createWorkspace = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { name, description, settings } = req.body;
  const ownerId = req.user._id;

  // Create workspace
  const workspace = await Workspace.create({
    name,
    description,
    owner: ownerId,
    settings: {
      ...settings,
      defaultTaskView: settings?.defaultTaskView || 'kanban'
    }
  });

  // Add owner as admin member
  await workspace.addMember(ownerId, 'admin', ownerId);

  logger.workspace('workspace_created', workspace._id, {
    name: workspace.name,
    owner: ownerId
  });

  createdResponse(res, 'Workspace created successfully', {
    workspace: workspace.toPublicProfile(ownerId)
  });
});

// @desc    Update workspace
// @route   PUT /api/v1/workspaces/:workspaceId
// @access  Private (Workspace Admin)
export const updateWorkspace = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { workspaceId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(userId, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  // Update workspace
  Object.assign(workspace, updates);
  await workspace.save();

  logger.workspace('workspace_updated', workspace._id, {
    updatedBy: userId,
    updatedFields: Object.keys(updates)
  });

  successResponse(res, 'Workspace updated successfully', {
    workspace: workspace.toPublicProfile(userId)
  });
});

// @desc    Delete workspace
// @route   DELETE /api/v1/workspaces/:workspaceId
// @access  Private (Workspace Owner)
export const deleteWorkspace = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Only owner can delete workspace
  if (workspace.owner.toString() !== userId.toString()) {
    return next(new AppError('Access denied. Only workspace owner can delete the workspace.', 403));
  }

  // Soft delete by archiving
  await workspace.archive(userId);

  logger.workspace('workspace_deleted', workspace._id, {
    deletedBy: userId,
    name: workspace.name
  });

  successResponse(res, 'Workspace deleted successfully');
});

// @desc    Get workspace members
// @route   GET /api/v1/workspaces/:workspaceId/members
// @access  Private (Workspace Member)
export const getWorkspaceMembers = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId)
    .populate('members.user', 'firstName lastName email avatar lastActive isOnline')
    .populate('owner', 'firstName lastName email avatar');

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is a member
  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  successResponse(res, 'Workspace members retrieved successfully', {
    members: workspace.members,
    owner: workspace.owner,
    totalMembers: workspace.memberCount
  });
});

// @desc    Add member to workspace
// @route   POST /api/v1/workspaces/:workspaceId/members
// @access  Private (Workspace Admin)
export const addWorkspaceMember = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const { email, role = 'member' } = req.body;
  const invitedBy = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(invitedBy, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new AppError('User with this email address not found.', 404));
  }

  // Check if user is already a member
  if (workspace.isMember(user._id)) {
    return next(new AppError('User is already a member of this workspace.', 409));
  }

  // Add member
  const membership = await workspace.addMember(user._id, role, invitedBy);

  logger.workspace('member_invited', workspace._id, {
    invitedUser: user._id,
    invitedBy,
    role
  });

  successResponse(res, 'Member added to workspace successfully', {
    membership: {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar
      },
      role: membership.role,
      joinedAt: membership.joinedAt
    }
  });
});

// @desc    Update member role
// @route   PUT /api/v1/workspaces/:workspaceId/members/:userId
// @access  Private (Workspace Admin)
export const updateMemberRole = catchAsync(async (req, res, next) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;
  const updatedBy = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(updatedBy, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  // Cannot change owner's role
  if (workspace.owner.toString() === userId) {
    return next(new AppError('Cannot change workspace owner role.', 403));
  }

  // Update member role
  const membership = await workspace.updateMemberRole(userId, role, updatedBy);

  successResponse(res, 'Member role updated successfully', {
    membership: {
      user: userId,
      role: membership.role,
      updatedAt: new Date()
    }
  });
});

// @desc    Remove member from workspace
// @route   DELETE /api/v1/workspaces/:workspaceId/members/:userId
// @access  Private (Workspace Admin)
export const removeWorkspaceMember = catchAsync(async (req, res, next) => {
  const { workspaceId, userId } = req.params;
  const removedBy = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(removedBy, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  // Cannot remove owner
  if (workspace.owner.toString() === userId) {
    return next(new AppError('Cannot remove workspace owner.', 403));
  }

  // Remove member
  const membership = await workspace.removeMember(userId, removedBy);

  successResponse(res, 'Member removed from workspace successfully');
});

// @desc    Get workspace statistics
// @route   GET /api/v1/workspaces/:workspaceId/stats
// @access  Private (Workspace Member)
export const getWorkspaceStats = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is a member
  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  // Get task statistics
  await workspace.updateTaskStats();

  successResponse(res, 'Workspace statistics retrieved successfully', {
    stats: {
      totalTasks: workspace.stats.totalTasks,
      completedTasks: workspace.stats.completedTasks,
      completionRate: workspace.completionRate,
      activeMembers: workspace.stats.activeMembers,
      lastActivity: workspace.stats.lastActivity
    }
  });
});

// @desc    Search public workspaces
// @route   GET /api/v1/workspaces/search
// @access  Private
export const searchWorkspaces = catchAsync(async (req, res, next) => {
  const { q: query, limit = 20 } = req.query;
  const userId = req.user._id;

  if (!query || query.trim().length < 2) {
    return next(new AppError('Search query must be at least 2 characters long.', 400));
  }

  const workspaces = await Workspace.searchWorkspaces(query.trim(), userId, parseInt(limit));

  successResponse(res, 'Workspaces search completed', {
    workspaces: workspaces.map(ws => ws.toPublicProfile(userId)),
    count: workspaces.length
  });
});

// @desc    Archive workspace
// @route   PUT /api/v1/workspaces/:workspaceId/archive
// @access  Private (Workspace Admin)
export const archiveWorkspace = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(userId, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  await workspace.archive(userId);

  successResponse(res, 'Workspace archived successfully');
});

// @desc    Unarchive workspace
// @route   PUT /api/v1/workspaces/:workspaceId/unarchive
// @access  Private (Workspace Admin)
export const unarchiveWorkspace = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  // Check if user is admin
  if (!workspace.hasRole(userId, 'admin')) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  await workspace.unarchive(userId);

  successResponse(res, 'Workspace unarchived successfully', {
    workspace: workspace.toPublicProfile(userId)
  });
});