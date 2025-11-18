import { useEffect, useRef, useState, useCallback } from 'react'
import { socketService } from '@/services/socketService'
import { useAuth } from './useAuth'

interface UseSocketOptions {
  workspaceId?: string
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
  onError?: (error: Error) => void
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { workspaceId, autoConnect = true, onConnect, onDisconnect, onError } = options
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(socketService.isConnected())
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null)

  // Use refs to avoid stale closures in event handlers
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
    onErrorRef.current = onError
  }, [onConnect, onDisconnect, onError])

  // Handle connection events
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
      onConnectRef.current?.()
    }

    const handleDisconnect = (reason: string) => {
      setIsConnected(false)
      onDisconnectRef.current?.(reason)
    }

    const handleConnectError = (error: Error) => {
      setConnectionError(error)
      onErrorRef.current?.(error)
    }

    // Set up event listeners
    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('connect_error', handleConnectError)

    // Auto-connect if requested and user is authenticated
    if (autoConnect && user) {
      socketService.connect()
    }

    // Cleanup
    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('connect_error', handleConnectError)
    }
  }, [autoConnect, user])

  // Handle workspace changes
  useEffect(() => {
    if (workspaceId && workspaceId !== currentWorkspace) {
      socketService.joinWorkspace(workspaceId)
      setCurrentWorkspace(workspaceId)
    } else if (!workspaceId && currentWorkspace) {
      socketService.leaveWorkspace(currentWorkspace)
      setCurrentWorkspace(null)
    }
  }, [workspaceId, currentWorkspace])

  // Event subscription helpers
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.on(event, callback)
    return () => socketService.off(event, callback)
  }, [])

  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data)
  }, [])

  // Task-specific helpers
  const subscribeToTask = useCallback((taskId: string) => {
    socketService.subscribeToTask(taskId)
  }, [])

  const unsubscribeFromTask = useCallback((taskId: string) => {
    socketService.unsubscribeFromTask(taskId)
  }, [])

  // Typing indicators
  const startTyping = useCallback((taskId?: string) => {
    socketService.startTyping(taskId)
  }, [])

  const stopTyping = useCallback((taskId?: string) => {
    socketService.stopTyping(taskId)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentWorkspace) {
        socketService.leaveWorkspace(currentWorkspace)
      }
    }
  }, [currentWorkspace])

  return {
    isConnected,
    connectionError,
    currentWorkspace,
    subscribe,
    emit,
    subscribeToTask,
    unsubscribeFromTask,
    startTyping,
    stopTyping,
    socketId: socketService.getSocketId(),
  }
}

// Hook for presence indicators
export const usePresence = (workspaceId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, { taskId?: string; timestamp: number }>>(new Map())

  const { subscribe } = useSocket({ workspaceId })

  useEffect(() => {
    const unsubscribers = [
      subscribe('user:online', (data: { userId: string }) => {
        setOnlineUsers(prev => new Set(prev).add(data.userId))
      }),

      subscribe('user:offline', (data: { userId: string }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }),

      subscribe('typing:start', (data: { userId: string; taskId?: string }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          newMap.set(data.userId, { taskId: data.taskId, timestamp: Date.now() })
          return newMap
        })
      }),

      subscribe('typing:stop', (data: { userId: string }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.userId)
          return newMap
        })
      }),
    ]

    // Clean up typing indicators after 3 seconds
    const cleanupTyping = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => {
        const newMap = new Map()
        for (const [userId, data] of prev) {
          if (now - data.timestamp < 3000) {
            newMap.set(userId, data)
          }
        }
        return newMap
      })
    }, 1000)

    return () => {
      unsubscribers.forEach(unsub => unsub())
      clearInterval(cleanupTyping)
    }
  }, [subscribe])

  return {
    onlineUsers: Array.from(onlineUsers),
    typingUsers,
    isUserOnline: (userId: string) => onlineUsers.has(userId),
    isUserTyping: (userId: string, taskId?: string) => {
      const typingData = typingUsers.get(userId)
      return typingData && (!taskId || typingData.taskId === taskId)
    },
  }
}

// Hook for real-time task updates
export const useTaskRealtime = (workspaceId: string, taskId?: string) => {
  const [taskUpdates, setTaskUpdates] = useState<any[]>([])
  const { subscribe, subscribeToTask, unsubscribeFromTask } = useSocket({ workspaceId })

  useEffect(() => {
    if (taskId) {
      subscribeToTask(taskId)
    }

    const unsubscribers = [
      subscribe('task:created', (data: any) => {
        if (data.workspaceId === workspaceId) {
          setTaskUpdates(prev => [...prev, { type: 'created', ...data }])
        }
      }),

      subscribe('task:updated', (data: any) => {
        if (data.workspaceId === workspaceId) {
          setTaskUpdates(prev => [...prev, { type: 'updated', ...data }])
        }
      }),

      subscribe('task:deleted', (data: any) => {
        if (data.workspaceId === workspaceId) {
          setTaskUpdates(prev => [...prev, { type: 'deleted', ...data }])
        }
      }),
    ]

    return () => {
      if (taskId) {
        unsubscribeFromTask(taskId)
      }
      unsubscribers.forEach(unsub => unsub())
    }
  }, [workspaceId, taskId, subscribe, subscribeToTask, unsubscribeFromTask])

  const clearUpdates = useCallback(() => {
    setTaskUpdates([])
  }, [])

  return { taskUpdates, clearUpdates }
}

// Hook for real-time comments
export const useCommentRealtime = (workspaceId: string, taskId: string) => {
  const [commentUpdates, setCommentUpdates] = useState<any[]>([])
  const { subscribe } = useSocket({ workspaceId })

  useEffect(() => {
    const unsubscribers = [
      subscribe('comment:created', (data: any) => {
        if (data.workspaceId === workspaceId && data.taskId === taskId) {
          setCommentUpdates(prev => [...prev, { type: 'created', ...data }])
        }
      }),

      subscribe('comment:updated', (data: any) => {
        if (data.workspaceId === workspaceId && data.taskId === taskId) {
          setCommentUpdates(prev => [...prev, { type: 'updated', ...data }])
        }
      }),

      subscribe('comment:deleted', (data: any) => {
        if (data.workspaceId === workspaceId && data.taskId === taskId) {
          setCommentUpdates(prev => [...prev, { type: 'deleted', ...data }])
        }
      }),

      subscribe('comment:reaction', (data: any) => {
        if (data.workspaceId === workspaceId && data.taskId === taskId) {
          setCommentUpdates(prev => [...prev, { type: 'reaction', ...data }])
        }
      }),
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [workspaceId, taskId, subscribe])

  const clearUpdates = useCallback(() => {
    setCommentUpdates([])
  }, [])

  return { commentUpdates, clearUpdates }
}