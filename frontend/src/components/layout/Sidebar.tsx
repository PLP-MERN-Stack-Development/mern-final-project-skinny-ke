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
  Collapse,
  Divider,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
} from '@mui/icons-material'

import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [workspacesOpen, setWorkspacesOpen] = useState(true)

  // Mock workspaces - will be replaced with real data
  const workspaces = [
    { id: '1', name: 'Marketing Team', slug: 'marketing-team', role: 'admin' },
    { id: '2', name: 'Development', slug: 'development', role: 'member' },
  ]

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Tasks',
      icon: <AssignmentIcon />,
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
    if (onClose) onClose()
  }

  const handleWorkspaceClick = (workspaceId: string) => {
    navigate(`/workspaces/${workspaceId}`)
    if (onClose) onClose()
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and Brand */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          CollabTask
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user?.avatar ? (
            <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
          ) : (
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </Avatar>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
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

        <Divider sx={{ my: 1 }} />

        {/* Workspaces Section */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Workspaces" />
            {workspacesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        <Collapse in={workspacesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {workspaces.map((workspace) => (
              <ListItem key={workspace.id} disablePadding>
                <ListItemButton
                  onClick={() => handleWorkspaceClick(workspace.id)}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    pl: 5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {workspace.name}
                        </Typography>
                        <Chip
                          label={workspace.role}
                          size="small"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/workspaces/new')}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  pl: 5,
                  color: 'primary.main',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="New Workspace" />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </List>

      {/* Settings */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/settings')}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  )
}

export default Sidebar