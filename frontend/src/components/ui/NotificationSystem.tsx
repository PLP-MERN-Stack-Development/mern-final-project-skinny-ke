import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Popover,
  Button,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as TaskIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useSocket } from '@/hooks/useSocket'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'task' | 'comment' | 'user'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
  data?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { subscribe } = useSocket()

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = subscribe('notification:new', (data: any) => {
      addNotification({
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        data: data.data,
      })
    })

    return unsubscribe
  }, [subscribe])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove after 10 seconds for non-persistent notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 10000)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Notification Bell Component
interface NotificationBellProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

export const NotificationBell = ({ onClick }: NotificationBellProps) => {
  const { unreadCount } = useNotifications()

  return (
    <IconButton color="inherit" onClick={onClick} sx={{ mr: 1 }}>
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  )
}

// Notification Panel Component
interface NotificationPanelProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  maxHeight?: number
}

export const NotificationPanel = ({
  anchorEl,
  onClose,
  maxHeight = 400
}: NotificationPanelProps) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.actionUrl
      onClose()
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />
      case 'error':
        return <ErrorIcon color="error" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'task':
        return <TaskIcon color="primary" />
      case 'comment':
        return <CommentIcon color="primary" />
      case 'user':
        return <PersonIcon color="primary" />
      default:
        return <InfoIcon color="info" />
    }
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ width: 360, maxHeight }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Notifications</Typography>
            {notifications.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={markAllAsRead}>
                  Mark all read
                </Button>
                <Button size="small" color="error" onClick={clearAll}>
                  Clear all
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: maxHeight - 80, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.timestamp.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  )
}

// Toast Notification Component
interface ToastNotificationProps {
  notification: Notification
  onClose: () => void
}

export const ToastNotification = ({ notification, onClose }: ToastNotificationProps) => {
  const getSeverity = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={getSeverity(notification.type)}
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>{notification.title}</AlertTitle>
        {notification.message}
        {notification.actionText && notification.actionUrl && (
          <Button
            color="inherit"
            size="small"
            onClick={() => window.location.href = notification.actionUrl!}
            sx={{ mt: 1 }}
          >
            {notification.actionText}
          </Button>
        )}
      </Alert>
    </Snackbar>
  )
}

// Main Notification System Component
export const NotificationSystem = () => {
  const { notifications, removeNotification } = useNotifications()
  const [bellAnchorEl, setBellAnchorEl] = useState<HTMLElement | null>(null)
  const [currentToast, setCurrentToast] = useState<Notification | null>(null)

  // Show toast for new notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read)
    if (unreadNotifications.length > 0 && !currentToast) {
      setCurrentToast(unreadNotifications[0])
    }
  }, [notifications, currentToast])

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setBellAnchorEl(event.currentTarget)
  }

  const handleBellClose = () => {
    setBellAnchorEl(null)
  }

  const handleToastClose = () => {
    if (currentToast) {
      removeNotification(currentToast.id)
      setCurrentToast(null)
    }
  }

  return (
    <>
      <NotificationBell onClick={handleBellClick} />
      <NotificationPanel
        anchorEl={bellAnchorEl}
        onClose={handleBellClose}
      />
      {currentToast && (
        <ToastNotification
          notification={currentToast}
          onClose={handleToastClose}
        />
      )}
    </>
  )
}

export default NotificationSystem