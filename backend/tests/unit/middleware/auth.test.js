const auth = require('../../../src/middleware/auth')
const jwt = require('jsonwebtoken')

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
      headers: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  describe('authenticateToken', () => {
    it('should call next() for valid token', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const token = jwt.sign({ userId }, process.env.JWT_SECRET)

      mockReq.header.mockReturnValue(`Bearer ${token}`)

      await auth.authenticateToken(mockReq, mockRes, mockNext)

      expect(mockReq.userId).toBe(userId)
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should return 401 for missing token', async () => {
      mockReq.header.mockReturnValue(null)

      await auth.authenticateToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 401 for invalid token format', async () => {
      mockReq.header.mockReturnValue('InvalidTokenFormat')

      await auth.authenticateToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 401 for expired token', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const expiredToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '-1h' })

      mockReq.header.mockReturnValue(`Bearer ${expiredToken}`)

      await auth.authenticateToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 401 for invalid token signature', async () => {
      const invalidToken = jwt.sign({ userId: '123' }, 'wrong-secret')

      mockReq.header.mockReturnValue(`Bearer ${invalidToken}`)

      await auth.authenticateToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('requireRole', () => {
    it('should call next() for user with required role', async () => {
      const userId = '507f1f77bcf86cd799439011'
      mockReq.userId = userId

      // Mock User.findById to return user with admin role
      const User = require('../../../src/models/User')
      User.findById = jest.fn().mockResolvedValue({
        _id: userId,
        role: 'admin',
      })

      const requireAdmin = auth.requireRole('admin')
      await requireAdmin(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should return 403 for user without required role', async () => {
      const userId = '507f1f77bcf86cd799439011'
      mockReq.userId = userId

      // Mock User.findById to return user with member role
      const User = require('../../../src/models/User')
      User.findById = jest.fn().mockResolvedValue({
        _id: userId,
        role: 'member',
      })

      const requireAdmin = auth.requireRole('admin')
      await requireAdmin(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent user', async () => {
      const userId = '507f1f77bcf86cd799439011'
      mockReq.userId = userId

      // Mock User.findById to return null
      const User = require('../../../src/models/User')
      User.findById = jest.fn().mockResolvedValue(null)

      const requireAdmin = auth.requireRole('admin')
      await requireAdmin(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const userId = '507f1f77bcf86cd799439011'
      mockReq.userId = userId

      // Mock User.findById to throw error
      const User = require('../../../src/models/User')
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'))

      const requireAdmin = auth.requireRole('admin')
      await requireAdmin(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('requireWorkspaceAccess', () => {
    it('should call next() for user with workspace access', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const workspaceId = '507f1f77bcf86cd799439012'
      mockReq.userId = userId
      mockReq.params = { workspaceId }

      // Mock Workspace.findOne to return workspace with user as member
      const Workspace = require('../../../src/models/Workspace')
      Workspace.findOne = jest.fn().mockResolvedValue({
        _id: workspaceId,
        members: [{ user: userId, role: 'member' }],
      })

      await auth.requireWorkspaceAccess(mockReq, mockRes, mockNext)

      expect(mockReq.workspace).toBeDefined()
      expect(mockReq.userRole).toBe('member')
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent workspace', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const workspaceId = '507f1f77bcf86cd799439012'
      mockReq.userId = userId
      mockReq.params = { workspaceId }

      // Mock Workspace.findOne to return null
      const Workspace = require('../../../src/models/Workspace')
      Workspace.findOne = jest.fn().mockResolvedValue(null)

      await auth.requireWorkspaceAccess(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 403 for user without workspace access', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const workspaceId = '507f1f77bcf86cd799439012'
      const otherUserId = '507f1f77bcf86cd799439013'
      mockReq.userId = userId
      mockReq.params = { workspaceId }

      // Mock Workspace.findOne to return workspace with different user
      const Workspace = require('../../../src/models/Workspace')
      Workspace.findOne = jest.fn().mockResolvedValue({
        _id: workspaceId,
        members: [{ user: otherUserId, role: 'member' }],
      })

      await auth.requireWorkspaceAccess(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this workspace',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('requireTaskAccess', () => {
    it('should call next() for user with task access through workspace', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const taskId = '507f1f77bcf86cd799439014'
      const workspaceId = '507f1f77bcf86cd799439012'
      mockReq.userId = userId
      mockReq.params = { taskId }

      // Mock Task.findById to return task
      const Task = require('../../../src/models/Task')
      Task.findById = jest.fn().mockResolvedValue({
        _id: taskId,
        workspace: workspaceId,
      })

      // Mock Workspace.findOne to return workspace with user access
      const Workspace = require('../../../src/models/Workspace')
      Workspace.findOne = jest.fn().mockResolvedValue({
        _id: workspaceId,
        members: [{ user: userId, role: 'member' }],
      })

      await auth.requireTaskAccess(mockReq, mockRes, mockNext)

      expect(mockReq.task).toBeDefined()
      expect(mockReq.workspace).toBeDefined()
      expect(mockReq.userRole).toBe('member')
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent task', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const taskId = '507f1f77bcf86cd799439014'
      mockReq.userId = userId
      mockReq.params = { taskId }

      // Mock Task.findById to return null
      const Task = require('../../../src/models/Task')
      Task.findById = jest.fn().mockResolvedValue(null)

      await auth.requireTaskAccess(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
        meta: expect.any(Object),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})