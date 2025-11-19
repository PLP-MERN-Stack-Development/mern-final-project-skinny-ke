const response = require('../../../src/utils/response')

describe('Response Utility', () => {
  let mockRes

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
  })

  describe('success()', () => {
    it('should send success response with default status 200', () => {
      const data = { message: 'Success' }
      const result = response.success(mockRes, data)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.any(Object),
      })
      expect(result).toBe(mockRes)
    })

    it('should send success response with custom status', () => {
      const data = { user: { id: 1 } }
      const result = response.success(mockRes, data, 201)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.any(Object),
      })
    })

    it('should include pagination data when provided', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        pages: 3,
      }

      response.success(mockRes, data, 200, pagination)

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
        meta: expect.any(Object),
      })
    })

    it('should handle null data', () => {
      response.success(mockRes, null)

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        meta: expect.any(Object),
      })
    })
  })

  describe('error()', () => {
    it('should send error response with default status 500', () => {
      const errorMessage = 'Internal server error'
      const result = response.error(mockRes, errorMessage)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
        meta: expect.any(Object),
      })
      expect(result).toBe(mockRes)
    })

    it('should send error response with custom status and code', () => {
      const errorMessage = 'Not found'
      const result = response.error(mockRes, errorMessage, 404, 'NOT_FOUND')

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorMessage,
        },
        meta: expect.any(Object),
      })
    })

    it('should handle error object with details', () => {
      const errorObj = {
        message: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      }

      response.error(mockRes, errorObj, 422, 'VALIDATION_ERROR')

      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errorObj.details,
        },
        meta: expect.any(Object),
      })
    })
  })

  describe('created()', () => {
    it('should send created response with status 201', () => {
      const data = { id: 1, name: 'New Item' }
      const result = response.created(mockRes, data)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.any(Object),
      })
      expect(result).toBe(mockRes)
    })
  })

  describe('noContent()', () => {
    it('should send no content response with status 204', () => {
      const result = response.noContent(mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(204)
      expect(mockRes.send).toHaveBeenCalled()
      expect(result).toBe(mockRes)
    })
  })

  describe('Meta data', () => {
    it('should include timestamp in meta', () => {
      const before = Date.now()
      response.success(mockRes, {})

      const call = mockRes.json.mock.calls[0][0]
      const after = Date.now()

      expect(call.meta.timestamp).toBeGreaterThanOrEqual(before)
      expect(call.meta.timestamp).toBeLessThanOrEqual(after)
    })

    it('should include requestId in meta when provided', () => {
      const mockReq = { id: 'req-123' }
      response.success(mockRes, {}, 200, null, mockReq)

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {},
        meta: expect.objectContaining({
          requestId: 'req-123',
        }),
      })
    })
  })
})