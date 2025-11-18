import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Chip,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
} from '@mui/icons-material'

import { useAuth } from '@/hooks/useAuth'
import { useWorkspaces } from '@/hooks/useWorkspaces'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { workspaces, isLoading } = useWorkspaces()
  const [workspacesOpen, setWorkspacesOpen] = useState(true)

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Tasks',
      icon: <CheckCircleIcon />,
      path: '/tasks',
    },
    {
      text: 'Calendar',
      icon: <CalendarIcon />,
      path: '/calendar',
    },
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      path: '/reports',
    },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleWorkspaceToggle = () => {
    setWorkspacesOpen(!workspacesOpen)
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and User Info */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            CollabTask
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={user.avatar}
              alt={user.firstName}
              sx={{ width: 32, height: 32 }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Workspaces Section */}
        <List>
          <ListItemButton
            onClick={handleWorkspaceToggle}
            sx={{ mx: 1, my: 0.5, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Workspaces" />
            {workspacesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={workspacesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {isLoading ? (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="Loading..." />
                </ListItem>
              ) : (
                workspaces?.map((workspace) => (
                  <ListItem key={workspace._id} disablePadding>
                    <ListItemButton
                      selected={location.pathname === `/workspaces/${workspace.slug}`}
                      onClick={() => handleNavigation(`/workspaces/${workspace.slug}`)}
                      sx={{
                        pl: 4,
                        mx: 1,
                        my: 0.5,
                        borderRadius: 1,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <FolderIcon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={workspace.name}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                        }}
                      />
                      <Chip
                        label={`${workspace.taskCount || 0}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 18,
                          fontSize: '0.7rem',
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}

              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation('/workspaces/new')}
                  sx={{
                    pl: 4,
                    mx: 1,
                    my: 0.5,
                    borderRadius: 1,
                    color: 'primary.main',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <AddIcon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Create Workspace"
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Settings */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => handleNavigation('/settings')}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}

export default Sidebar