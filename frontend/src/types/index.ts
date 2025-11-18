// User Types
export interface User {
  _id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'manager' | 'member'
  preferences: {
    theme: 'light' | 'dark'
    notifications: {
      email: boolean
      push: boolean
      inApp: boolean
    }
  }
  lastActive: string
  isOnline: boolean
  timezone: string
  createdAt: string
  updatedAt: string
}

// Workspace Types
export interface Workspace {
  _id: string
  name: string
  description?: string
  slug: string
  owner: string
  members: WorkspaceMember[]
  settings: {
    isPublic: boolean
    allowGuestAccess: boolean
    defaultTaskView: 'kanban' | 'list' | 'calendar'
  }
  branding?: {
    primaryColor: string
    logo?: string
  }
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  user: User
  role: 'admin' | 'manager' | 'member'
  joinedAt: string
}

// Task Types
export interface Task {
  _id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  workspace: string
  assignees: User[]
  createdBy: User
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  attachments: TaskAttachment[]
  dependencies: string[]
  subtasks: Subtask[]
  comments: Comment[]
  activity: TaskActivity[]
  createdAt: string
  updatedAt: string
}

export interface TaskAttachment {
  filename: string
  url: string
  uploadedBy: string
  uploadedAt: string
}

export interface Subtask {
  title: string
  completed: boolean
  assignedTo?: string
}

export interface TaskActivity {
  type: string
  user: string
  timestamp: string
  details?: any
}

// Comment Types
export interface Comment {
  _id: string
  content: string
  author: User
  task: string
  mentions: User[]
  attachments: CommentAttachment[]
  reactions: CommentReaction[]
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CommentAttachment {
  filename: string
  url: string
}

export interface CommentReaction {
  user: string
  emoji: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any[]
  }
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  username: string
}

export interface TaskForm {
  title: string
  description?: string
  assignees?: string[]
  priority?: Task['priority']
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
  dependencies?: string[]
}

// Real-time Event Types
export interface RealtimeEvent {
  type: string
  workspaceId?: string
  taskId?: string
  userId?: string
  data: any
  timestamp: string
}

export interface TaskUpdateEvent extends RealtimeEvent {
  type: 'task:updated'
  taskId: string
  updates: Partial<Task>
  updatedBy: string
}

export interface CommentEvent extends RealtimeEvent {
  type: 'comment:created' | 'comment:updated' | 'comment:deleted'
  taskId: string
  comment?: Comment
  commentId?: string
}

export interface PresenceEvent extends RealtimeEvent {
  type: 'user:presence'
  userId: string
  status: 'online' | 'away' | 'offline'
}

// Filter and Sort Types
export interface TaskFilters {
  status?: Task['status'][]
  priority?: Task['priority'][]
  assignee?: string[]
  tags?: string[]
  dueDateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface TaskSort {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title'
  direction: 'asc' | 'desc'
}

export interface PaginationParams {
  page: number
  limit: number
}

// Notification Types
export interface Notification {
  _id: string
  type: 'task_assigned' | 'task_due' | 'comment_mention' | 'workspace_invite'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  metadata: any
  createdAt: string
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any[]
  status: number
}

// Loading States
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// Theme Types
export interface ThemeColors {
  primary: string
  secondary: string
  error: string
  warning: string
  success: string
  background: {
    default: string
    paper: string
  }
  text: {
    primary: string
    secondary: string
  }
}