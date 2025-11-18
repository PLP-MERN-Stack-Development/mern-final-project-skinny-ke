import { validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  notFoundResponse
} from '../utils/response.js';
import logger from '../utils/logger.js';

// @desc    Get tasks for a workspace
// @route   GET /api/v1/workspaces/:workspaceId/tasks
// @access  Private (Workspace Member)
export const getTasks = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  // Check if workspace exists and user is member
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  // Parse query parameters
  const {
    status,
    priority,
    assignee,
    tags,
    dueDateRange,
    search,
    page = 1,
    limit = 20,
    sort = 'createdAt'
  } = req.query;

  // Build filters
  const filters = {};

  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (assignee) filters.assignee = assignee;
  if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

  if (dueDateRange) {
    filters.dueDateRange = {
      start: new Date(dueDateRange.start),
      end: new Date(dueDateRange.end)
    };
  }

  if (search) filters.search = search.trim();

  // Get tasks with pagination
  const result = await Task.findByWorkspace(workspaceId, filters, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort
  });

  successResponse(res, 'Tasks retrieved successfully', {
    tasks: result.tasks,
    pagination: result.pagination,
    filters: {
      applied: filters,
      available: {
        statuses: ['todo', 'in-progress', 'review', 'done'],
        priorities: ['low', 'medium', 'high', 'urgent']
      }
    }
  });
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:taskId
// @access  Private (Workspace Member)
export const getTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Task retrieved successfully', {
    task: detailedTask
  });
});

// @desc    Create new task
// @route   POST /api/v1/workspaces/:workspaceId/tasks
// @access  Private (Workspace Member)
export const createTask = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { workspaceId } = req.params;
  const userId = req.user._id;
  const {
    title,
    description,
    priority,
    assignees,
    dueDate,
    estimatedHours,
    tags
  } = req.body;

  // Check if workspace exists and user is member
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  // Validate assignees are workspace members
  if (assignees && assignees.length > 0) {
    for (const assigneeId of assignees) {
      if (!workspace.isMember(assigneeId)) {
        return next(new AppError(`Assignee ${assigneeId} is not a member of this workspace.`, 400));
      }
    }
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    workspace: workspaceId,
    createdBy: userId,
    priority: priority || 'medium',
    assignees: assignees || [],
    dueDate: dueDate ? new Date(dueDate) : undefined,
    estimatedHours,
    tags: tags || []
  });

  // Log activity
  await task.logActivity('created', userId);

  // Update workspace stats
  await workspace.updateTaskStats();

  const detailedTask = await task.toDetailedJSON(userId);

  logger.task('task_created', task._id, {
    workspace: workspaceId,
    createdBy: userId,
    title: task.title
  });

  createdResponse(res, 'Task created successfully', {
    task: detailedTask
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:taskId
// @access  Private (Workspace Member)
export const updateTask = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { taskId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  // Validate assignees if being updated
  if (updates.assignees) {
    const workspace = await Workspace.findById(task.workspace);
    for (const assigneeId of updates.assignees) {
      if (!workspace.isMember(assigneeId)) {
        return next(new AppError(`Assignee ${assigneeId} is not a member of this workspace.`, 400));
      }
    }
  }

  // Update task
  Object.assign(task, updates);
  await task.save();

  // Log activity for significant changes
  if (updates.status) {
    await task.logActivity('status_changed', userId, {}, task.status, updates.status);
  }
  if (updates.priority) {
    await task.logActivity('priority_changed', userId, {}, task.priority, updates.priority);
  }
  if (updates.dueDate) {
    await task.logActivity('due_date_changed', userId, {}, task.dueDate, updates.dueDate);
  }

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Task updated successfully', {
    task: detailedTask
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:taskId
// @access  Private (Workspace Member)
export const deleteTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  // Archive task instead of hard delete
  await task.archive(userId);

  successResponse(res, 'Task deleted successfully');
});

// @desc    Update task status
// @route   PATCH /api/v1/tasks/:taskId/status
// @access  Private (Workspace Member)
export const updateTaskStatus = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  if (!['todo', 'in-progress', 'review', 'done'].includes(status)) {
    return next(new AppError('Invalid status value.', 400));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  await task.updateStatus(status, userId);

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Task status updated successfully', {
    task: detailedTask
  });
});

// @desc    Add assignee to task
// @route   POST /api/v1/tasks/:taskId/assignees
// @access  Private (Workspace Member)
export const addTaskAssignee = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { userId: assigneeId } = req.body;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  // Check if assignee is a workspace member
  const workspace = await Workspace.findById(task.workspace);
  if (!workspace.isMember(assigneeId)) {
    return next(new AppError('Assignee must be a member of the workspace.', 400));
  }

  await task.addAssignee(assigneeId, userId);

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Assignee added successfully', {
    task: detailedTask
  });
});

// @desc    Remove assignee from task
// @route   DELETE /api/v1/tasks/:taskId/assignees/:assigneeId
// @access  Private (Workspace Member)
export const removeTaskAssignee = catchAsync(async (req, res, next) => {
  const { taskId, assigneeId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  await task.removeAssignee(assigneeId, userId);

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Assignee removed successfully', {
    task: detailedTask
  });
});

// @desc    Add subtask
// @route   POST /api/v1/tasks/:taskId/subtasks
// @access  Private (Workspace Member)
export const addSubtask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { title, assignedTo } = req.body;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  // Validate assignedTo if provided
  if (assignedTo) {
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(assignedTo)) {
      return next(new AppError('Assigned user must be a member of the workspace.', 400));
    }
  }

  const subtask = await task.addSubtask(title, assignedTo, userId);

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Subtask added successfully', {
    task: detailedTask,
    subtask
  });
});

// @desc    Complete subtask
// @route   PATCH /api/v1/tasks/:taskId/subtasks/:subtaskId/complete
// @access  Private (Workspace Member)
export const completeSubtask = catchAsync(async (req, res, next) => {
  const { taskId, subtaskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  const subtask = await task.completeSubtask(subtaskId, userId);

  const detailedTask = await task.toDetailedJSON(userId);

  successResponse(res, 'Subtask completed successfully', {
    task: detailedTask,
    subtask
  });
});

// @desc    Get task activity log
// @route   GET /api/v1/tasks/:taskId/activity
// @access  Private (Workspace Member)
export const getTaskActivity = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const task = await Task.findById(taskId);

  if (!task) {
    return notFoundResponse(res, 'Task not found');
  }

  // Check if user can access this task
  if (!(await task.canAccess(userId))) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  // Get activity with pagination
  const activity = task.activity
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice((page - 1) * limit, page * limit);

  // Populate user details
  const populatedActivity = await Promise.all(
    activity.map(async (item) => {
      const user = await User.findById(item.user).select('firstName lastName avatar');
      return {
        ...item.toObject(),
        user
      };
    })
  );

  successResponse(res, 'Task activity retrieved successfully', {
    activity: populatedActivity,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: task.activity.length,
      pages: Math.ceil(task.activity.length / limit)
    }
  });
});

// @desc    Get workspace task statistics
// @route   GET /api/v1/workspaces/:workspaceId/tasks/stats
// @access  Private (Workspace Member)
export const getWorkspaceTaskStats = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  // Check if workspace exists and user is member
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  const stats = await Task.getWorkspaceStats(workspaceId);

  successResponse(res, 'Workspace task statistics retrieved successfully', {
    stats
  });
});

// @desc    Get overdue tasks
// @route   GET /api/v1/workspaces/:workspaceId/tasks/overdue
// @access  Private (Workspace Member)
export const getOverdueTasks = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  // Check if workspace exists and user is member
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  const tasks = await Task.findOverdue(workspaceId);

  successResponse(res, 'Overdue tasks retrieved successfully', {
    tasks,
    count: tasks.length
  });
});

// @desc    Get tasks due today
// @route   GET /api/v1/workspaces/:workspaceId/tasks/due-today
// @access  Private (Workspace Member)
export const getTasksDueToday = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  // Check if workspace exists and user is member
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return notFoundResponse(res, 'Workspace not found');
  }

  if (!workspace.isMember(userId)) {
    return next(new AppError('Access denied. You are not a member of this workspace.', 403));
  }

  const tasks = await Task.findDueToday(workspaceId);

  successResponse(res, 'Tasks due today retrieved successfully', {
    tasks,
    count: tasks.length
  });
});