import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'

// Pages
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Workspace from '@/pages/Workspace'
import TaskDetail from '@/pages/TaskDetail'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'

// Components
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Hooks
import { useAuth } from '@/hooks/useAuth'

function App() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workspaces/:workspaceId" element={<Workspace />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                typography: 'h4',
              }}
            >
              404 - Page Not Found
            </Box>
          }
        />
      </Routes>
    </Box>
  )
}

export default App