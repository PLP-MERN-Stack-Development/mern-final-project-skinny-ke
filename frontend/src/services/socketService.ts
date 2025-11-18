import { io, Socket } from 'socket.io-client'
import { User, Task, Comment, Workspace } from '@/types'

export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void

  // User presence events
  'user:online': (data: { userId: string; workspaceId: string }) => void
  'user:offline': (data: { userId: string; workspaceId: string }) => void
  'user:presence': (data: { userId: string; workspaceId: string; status: 'online' | 'away' | 'offline' }) => void

  // Task events
  'task:created': (data: { workspaceId: string; task: Task }) => void
  'task:updated': (data: { workspaceId: string; task: Task; changes: any }) => void
  'task:deleted': (data: { workspaceId: string; taskId: string }) => void
  'task:assigned': (data: { workspaceId: string; taskId: string; userId: string; assignedBy: string }) => void
  'task:unassigned': (data: { workspaceId: string; taskId: string; userId: string }) => void

  // Comment events
  'comment:created': (data: { workspaceId: string; taskId: string; comment: Comment }) => void
  'comment:updated': (data: { workspaceId: string; taskId: string; comment: Comment }) => void
  'comment:deleted': (data: { workspaceId: string; taskId: string; commentId: string }) => void
  'comment:reaction': (data: { workspaceId: string; taskId: string; commentId: string; userId: string; emoji: string; action: 'add' | 'remove' }) => void

  // Workspace events
  'workspace:member:joined': (data: { workspaceId: string; user: User; role: string }) => void
  'workspace:member:left': (data: { workspaceId: string; userId: string }) => void
  'workspace:member:role:changed': (data: { workspaceId: string; userId: string; oldRole: string; newRole: string }) => void

  // Typing indicators
  'typing:start': (data: { workspaceId: string; taskId?: string; userId: string; userName: string }) => void
  'typing:stop': (data: { workspaceId: string; taskId?: string; userId: string }) => void

  // Notification events
  'notification:new': (data: { userId: string; notification: any }) => void
  'notification:read': (data: { userId: string; notificationId: string }) => void
}

class SocketService {
  private socket: Socket | null = null
  private currentWorkspace: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.initializeSocket()
  }

  private initializeSocket() {
    const token = localStorage.getItem('collabtask_auth')
    let authToken = null

    if (token) {
      try {
        const parsed = JSON.parse(token)
        authToken = parsed.token
      } catch (error) {
        console.error('Error parsing auth token for socket:', error)
      }
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

    this.socket = io(socketUrl, {
      auth: {
        token: authToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.reconnectAttempts = 0

      // Rejoin workspace if we were in one
      if (this.currentWorkspace) {
        this.joinWorkspace(this.currentWorkspace)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)

      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  }

  // Connection management
  connect(): void {
    if (!this.socket) {
      this.initializeSocket()
    } else if (!this.socket.connected) {
      this.socket.connect()
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.currentWorkspace = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Workspace management
  joinWorkspace(workspaceId: string): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('Socket not connected, cannot join workspace')
      return
    }

    // Leave current workspace if different
    if (this.currentWorkspace && this.currentWorkspace !== workspaceId) {
      this.leaveWorkspace(this.currentWorkspace)
    }

    console.log('Joining workspace:', workspaceId)
    this.socket.emit('workspace:join', { workspaceId })
    this.currentWorkspace = workspaceId
  }

  leaveWorkspace(workspaceId?: string): void {
    const workspaceToLeave = workspaceId || this.currentWorkspace
    if (!this.socket || !workspaceToLeave) return

    console.log('Leaving workspace:', workspaceToLeave)
    this.socket.emit('workspace:leave', { workspaceId: workspaceToLeave })

    if (workspaceToLeave === this.currentWorkspace) {
      this.currentWorkspace = null
    }
  }

  // Task events
  subscribeToTask(taskId: string): void {
    if (!this.socket || !this.isConnected()) return
    this.socket.emit('task:subscribe', { taskId })
  }

  unsubscribeFromTask(taskId: string): void {
    if (!this.socket || !this.isConnected()) return
    this.socket.emit('task:unsubscribe', { taskId })
  }

  // Typing indicators
  startTyping(taskId?: string): void {
    if (!this.socket || !this.isConnected() || !this.currentWorkspace) return

    this.socket.emit('typing:start', {
      workspaceId: this.currentWorkspace,
      taskId,
    })
  }

  stopTyping(taskId?: string): void {
    if (!this.socket || !this.isConnected() || !this.currentWorkspace) return

    this.socket.emit('typing:stop', {
      workspaceId: this.currentWorkspace,
      taskId,
    })
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) return
    this.socket.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return
    this.socket.off(event, callback)
  }

  // Emit custom events
  emit(event: string, data: any): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('Socket not connected, cannot emit event:', event)
      return
    }

    this.socket.emit(event, data)
  }

  // Get current workspace
  getCurrentWorkspace(): string | null {
    return this.currentWorkspace
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// Create singleton instance
export const socketService = new SocketService()

// Export types
export type { SocketEvents }