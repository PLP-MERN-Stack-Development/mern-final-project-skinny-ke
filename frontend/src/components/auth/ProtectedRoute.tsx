import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />
  }

  // If authentication is not required but user is authenticated (e.g., login/register pages)
  if (!requireAuth && user) {
    return <Navigate to={redirectTo || '/dashboard'} replace />
  }

  // Render the protected content
  return <>{children}</>
}

export default ProtectedRoute