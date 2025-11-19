import { renderHook, act, waitFor } from '@testing-library/react'
import { useSocket, usePresence, useTaskRealtime } from './useSocket'
import { socketService } from '../services/socketService'

// Mock the socket service
jest.mock('../services/socketService')
jest.mock('../hooks/useAuth')

const mockSocketService = socketService as jest.Mocked<typeof socketService>

describe('useSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocketService.isConnected.mockReturnValue(false)
    mockSocketService.getSocketId.mockReturnValue('socket-123')
    mockSocketService.getCurrentWorkspace.mockReturnValue(null)
  })

  it('connects to socket when autoConnect is true and user exists', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    // Mock useAuth to return a user
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: mockUser,
      isLoading: false,
    })

    renderHook(() => useSocket({ autoConnect: true }))

    expect(mockSocketService.connect).toHaveBeenCalled()
  })

  it('does not connect when autoConnect is false', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    })

    renderHook(() => useSocket({ autoConnect: false }))

    expect(mockSocketService.connect).not.toHaveBeenCalled()
  })

  it('joins workspace when workspaceId is provided', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    })

    renderHook(() => useSocket({ workspaceId: 'workspace-1' }))

    expect(mockSocketService.joinWorkspace).toHaveBeenCalledWith('workspace-1')
  })

  it('leaves workspace when workspaceId changes', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    })

    const { rerender } = renderHook(
      ({ workspaceId }) => useSocket({ workspaceId }),
      { initialProps: { workspaceId: 'workspace-1' } }
    )

    expect(mockSocketService.joinWorkspace).toHaveBeenCalledWith('workspace-1')

    rerender({ workspaceId: 'workspace-2' })

    expect(mockSocketService.leaveWorkspace).toHaveBeenCalledWith('workspace-1')
    expect(mockSocketService.joinWorkspace).toHaveBeenCalledWith('workspace-2')
  })

  it('subscribes to events correctly', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useSocket())

    const mockCallback = jest.fn()
    const unsubscribe = result.current.subscribe('test:event', mockCallback)

    expect(mockSocketService.on).toHaveBeenCalledWith('test:event', mockCallback)

    // Test unsubscribe
    unsubscribe()
    expect(mockSocketService.off).toHaveBeenCalledWith('test:event', mockCallback)
  })

  it('emits events correctly', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useSocket())

    const testData = { message: 'test' }
    result.current.emit('test:event', testData)

    expect(mockSocketService.emit).toHaveBeenCalledWith('test:event', testData)
  })

  it('handles task-specific methods', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useSocket())

    result.current.subscribeToTask('task-1')
    expect(mockSocketService.subscribeToTask).toHaveBeenCalledWith('task-1')

    result.current.unsubscribeFromTask('task-1')
    expect(mockSocketService.unsubscribeFromTask).toHaveBeenCalledWith('task-1')
  })

  it('handles typing indicators', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useSocket())

    result.current.startTyping('task-1')
    expect(mockSocketService.startTyping).toHaveBeenCalledWith('task-1')

    result.current.stopTyping('task-1')
    expect(mockSocketService.stopTyping).toHaveBeenCalledWith('task-1')
  })

  it('returns correct connection state', () => {
    const mockUseAuth = require('../hooks/useAuth')
    mockUseAuth.useAuth = jest.fn().mockReturnValue({
      user: null,
      isLoading: false,
    })

    mockSocketService.isConnected.mockReturnValue(true)

    const { result } = renderHook(() => useSocket())

    expect(result.current.isConnected).toBe(true)
    expect(result.current.socketId).toBe('socket-123')
  })
})

describe('usePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks online users', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { result } = renderHook(() => usePresence('workspace-1'))

    // Simulate user coming online
    const onlineCallback = mockSubscribe.mock.calls.find(
      call => call[0] === 'user:online'
    )[1]

    act(() => {
      onlineCallback({ userId: 'user-1' })
    })

    expect(result.current.onlineUsers).toContain('user-1')
    expect(result.current.isUserOnline('user-1')).toBe(true)
  })

  it('tracks typing users', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { result } = renderHook(() => usePresence('workspace-1'))

    // Simulate user starting to type
    const typingCallback = mockSubscribe.mock.calls.find(
      call => call[0] === 'typing:start'
    )[1]

    act(() => {
      typingCallback({ userId: 'user-1', taskId: 'task-1' })
    })

    expect(result.current.isUserTyping('user-1', 'task-1')).toBe(true)
    expect(result.current.typingUsers.get('user-1')).toEqual({
      taskId: 'task-1',
      timestamp: expect.any(Number),
    })
  })

  it('cleans up typing indicators after timeout', async () => {
    jest.useFakeTimers()

    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { result } = renderHook(() => usePresence('workspace-1'))

    // Simulate user starting to type
    const typingCallback = mockSubscribe.mock.calls.find(
      call => call[0] === 'typing:start'
    )[1]

    act(() => {
      typingCallback({ userId: 'user-1', taskId: 'task-1' })
    })

    expect(result.current.isUserTyping('user-1')).toBe(true)

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(4000) // More than 3 seconds
    })

    expect(result.current.isUserTyping('user-1')).toBe(false)

    jest.useRealTimers()
  })
})

describe('useTaskRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('subscribes to task events', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    renderHook(() => useTaskRealtime('workspace-1', 'task-1'))

    expect(mockSocketService.subscribeToTask).toHaveBeenCalledWith('task-1')
  })

  it('tracks task updates', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { result } = renderHook(() => useTaskRealtime('workspace-1', 'task-1'))

    // Simulate task update
    const updateCallback = mockSubscribe.mock.calls.find(
      call => call[0] === 'task:updated'
    )[1]

    act(() => {
      updateCallback({
        workspaceId: 'workspace-1',
        taskId: 'task-1',
        changes: { status: 'completed' },
      })
    })

    expect(result.current.taskUpdates).toHaveLength(1)
    expect(result.current.taskUpdates[0]).toEqual({
      type: 'updated',
      workspaceId: 'workspace-1',
      taskId: 'task-1',
      changes: { status: 'completed' },
    })
  })

  it('clears updates when requested', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { result } = renderHook(() => useTaskRealtime('workspace-1', 'task-1'))

    // Add an update
    const updateCallback = mockSubscribe.mock.calls.find(
      call => call[0] === 'task:updated'
    )[1]

    act(() => {
      updateCallback({
        workspaceId: 'workspace-1',
        taskId: 'task-1',
        changes: { status: 'completed' },
      })
    })

    expect(result.current.taskUpdates).toHaveLength(1)

    // Clear updates
    act(() => {
      result.current.clearUpdates()
    })

    expect(result.current.taskUpdates).toHaveLength(0)
  })

  it('unsubscribes from task on cleanup', () => {
    const mockSubscribe = jest.fn()
    mockSocketService.on = mockSubscribe

    const { unmount } = renderHook(() => useTaskRealtime('workspace-1', 'task-1'))

    unmount()

    expect(mockSocketService.unsubscribeFromTask).toHaveBeenCalledWith('task-1')
  })
})