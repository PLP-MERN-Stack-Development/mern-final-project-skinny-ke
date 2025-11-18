import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addTaskAssignee,
  removeTaskAssignee,
  addSubtask,
  completeSubtask,
  getTaskActivity,
  getWorkspaceTaskStats,
  getOverdueTasks,
  getTasksDueToday
} from '../controllers/taskController.js';
import {
  protect,
  workspaceMember
} from '../middleware/auth.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateObjectId
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Task CRUD routes
router.route('/')
  .get(validateObjectId, workspaceMember(), getTasks)
  .post(validateObjectId, validateCreateTask, workspaceMember(), createTask);

router.route('/:taskId')
  .get(validateObjectId, getTask)
  .put(validateObjectId, validateUpdateTask, updateTask)
  .delete(validateObjectId, deleteTask);

// Task status management
router.patch('/:taskId/status', validateObjectId, updateTaskStatus);

// Task assignee management
router.post('/:taskId/assignees', validateObjectId, addTaskAssignee);
router.delete('/:taskId/assignees/:assigneeId', validateObjectId, removeTaskAssignee);

// Subtask management
router.post('/:taskId/subtasks', validateObjectId, addSubtask);
router.patch('/:taskId/subtasks/:subtaskId/complete', validateObjectId, completeSubtask);

// Task activity
router.get('/:taskId/activity', validateObjectId, getTaskActivity);

// Workspace-level task routes (nested under workspaces)
router.get('/workspaces/:workspaceId/stats', validateObjectId, workspaceMember(), getWorkspaceTaskStats);
router.get('/workspaces/:workspaceId/overdue', validateObjectId, workspaceMember(), getOverdueTasks);
router.get('/workspaces/:workspaceId/due-today', validateObjectId, workspaceMember(), getTasksDueToday);

export default router;