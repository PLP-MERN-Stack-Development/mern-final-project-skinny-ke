import express from 'express';
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
  getWorkspaceStats,
  searchWorkspaces,
  archiveWorkspace,
  unarchiveWorkspace
} from '../controllers/workspaceController.js';
import {
  protect,
  workspaceMember,
  workspaceAdmin
} from '../middleware/auth.js';
import {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateObjectId
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Workspace CRUD routes
router.route('/')
  .get(getWorkspaces)
  .post(validateCreateWorkspace, createWorkspace);

// Search workspaces
router.get('/search', searchWorkspaces);

// Workspace-specific routes
router.route('/:workspaceId')
  .get(validateObjectId, workspaceMember(), getWorkspace)
  .put(validateObjectId, validateUpdateWorkspace, workspaceAdmin(), updateWorkspace)
  .delete(validateObjectId, workspaceAdmin(), deleteWorkspace);

// Workspace archive/unarchive
router.put('/:workspaceId/archive', validateObjectId, workspaceAdmin(), archiveWorkspace);
router.put('/:workspaceId/unarchive', validateObjectId, workspaceAdmin(), unarchiveWorkspace);

// Workspace statistics
router.get('/:workspaceId/stats', validateObjectId, workspaceMember(), getWorkspaceStats);

// Workspace members management
router.get('/:workspaceId/members', validateObjectId, workspaceMember(), getWorkspaceMembers);
router.post('/:workspaceId/members', validateObjectId, workspaceAdmin(), addWorkspaceMember);

// Member role management
router.put('/:workspaceId/members/:userId', validateObjectId, workspaceAdmin(), updateMemberRole);
router.delete('/:workspaceId/members/:userId', validateObjectId, workspaceAdmin(), removeWorkspaceMember);

export default router;