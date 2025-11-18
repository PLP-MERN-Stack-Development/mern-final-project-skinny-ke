import { Box, Avatar, Typography, Chip, Tooltip } from '@mui/material'
import { styled } from '@mui/material/styles'
import { FiberManualRecord as OnlineIcon } from '@mui/icons-material'

const StyledPresenceIndicator = styled(Box)<{ status: 'online' | 'away' | 'offline' }>(({ theme, status }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}))

const StatusDot = styled(OnlineIcon)<{ status: 'online' | 'away' | 'offline' }>(({ theme, status }) => ({
  position: 'absolute',
  bottom: 2,
  right: 2,
  width: 12,
  height: 12,
  borderRadius: '50%',
  border: `2px solid ${theme.palette.background.paper}`,
  backgroundColor:
    status === 'online'
      ? theme.palette.success.main
      : status === 'away'
      ? theme.palette.warning.main
      : theme.palette.grey[400],
  zIndex: 1,
}))

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  animation: 'pulse 1.5s ease-in-out infinite',
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
}))

interface PresenceIndicatorProps {
  userId: string
  userName: string
  avatar?: string
  status: 'online' | 'away' | 'offline'
  isTyping?: boolean
  typingTaskId?: string
  showName?: boolean
  size?: 'small' | 'medium' | 'large'
}

const PresenceIndicator = ({
  userId,
  userName,
  avatar,
  status,
  isTyping = false,
  typingTaskId,
  showName = true,
  size = 'medium',
}: PresenceIndicatorProps) => {
  const avatarSize = {
    small: 24,
    medium: 32,
    large: 40,
  }[size]

  const statusText = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  }[status]

  const tooltipContent = (
    <Box>
      <Typography variant="body2" fontWeight={500}>
        {userName}
      </Typography>
      <Typography variant="caption" color="inherit">
        {statusText}
        {isTyping && ' • Typing...'}
      </Typography>
    </Box>
  )

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <StyledPresenceIndicator status={status}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={avatar}
            alt={userName}
            sx={{
              width: avatarSize,
              height: avatarSize,
              fontSize: avatarSize * 0.4,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <StatusDot status={status} />
        </Box>

        {showName && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </Typography>
            {isTyping && (
              <TypingIndicator>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    '& > div': {
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'currentColor',
                      animation: 'typing 1.4s ease-in-out infinite',
                      '&:nth-of-type(1)': { animationDelay: '0s' },
                      '&:nth-of-type(2)': { animationDelay: '0.2s' },
                      '&:nth-of-type(3)': { animationDelay: '0.4s' },
                    },
                    '@keyframes typing': {
                      '0%, 60%, 100%': { transform: 'translateY(0)' },
                      '30%': { transform: 'translateY(-8px)' },
                    },
                  }}
                >
                  <div />
                  <div />
                  <div />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  typing{typingTaskId ? ' in task' : ''}
                </Typography>
              </TypingIndicator>
            )}
          </Box>
        )}
      </StyledPresenceIndicator>
    </Tooltip>
  )
}

// Component for showing multiple users' presence
interface PresenceListProps {
  users: Array<{
    id: string
    name: string
    avatar?: string
    status: 'online' | 'away' | 'offline'
    isTyping?: boolean
    typingTaskId?: string
  }>
  maxVisible?: number
  size?: 'small' | 'medium' | 'large'
}

export const PresenceList = ({
  users,
  maxVisible = 5,
  size = 'small'
}: PresenceListProps) => {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {visibleUsers.map((user) => (
        <PresenceIndicator
          key={user.id}
          userId={user.id}
          userName={user.name}
          avatar={user.avatar}
          status={user.status}
          isTyping={user.isTyping}
          typingTaskId={user.typingTaskId}
          showName={false}
          size={size}
        />
      ))}

      {remainingCount > 0 && (
        <Tooltip
          title={
            <Box>
              {users.slice(maxVisible).map((user) => (
                <Box key={user.id} sx={{ py: 0.5 }}>
                  <PresenceIndicator
                    userId={user.id}
                    userName={user.name}
                    avatar={user.avatar}
                    status={user.status}
                    isTyping={user.isTyping}
                    typingTaskId={user.typingTaskId}
                    showName={true}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          }
          arrow
        >
          <Chip
            label={`+${remainingCount}`}
            size="small"
            variant="outlined"
            sx={{
              height: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
              fontSize: '0.75rem',
            }}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export default PresenceIndicator