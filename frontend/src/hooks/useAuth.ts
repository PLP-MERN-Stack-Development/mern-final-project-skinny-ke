import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { User, LoginForm, RegisterForm, ApiResponse } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AUTH_STORAGE_KEY = 'collabtask_auth'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const queryClient = useQueryClient()

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          const { user, token } = JSON.parse(stored)
          if (token && user) {
            setAuthState({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            })
            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }))
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    loadAuthState()
  }, [])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginForm): Promise<{ user: User; token: string; refreshToken: string }> => {
      const response = await axios.post('/api/v1/auth/login', credentials)
      return response.data.data
    },
    onSuccess: (data) => {
      const { user, token, refreshToken } = data

      // Update state
      setAuthState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })

      // Store in localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user,
        token,
        refreshToken,
      }))

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Invalidate queries to refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterForm): Promise<{ user: User; token: string }> => {
      const response = await axios.post('/api/v1/auth/register', userData)
      return response.data.data
    },
    onSuccess: (data) => {
      const { user, token } = data

      // Update state
      setAuthState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })

      // Store in localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user,
        token,
      }))

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  // Logout function
  const logout = () => {
    // Clear state
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })

    // Clear localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY)

    // Clear axios header
    delete axios.defaults.headers.common['Authorization']

    // Clear all cached queries
    queryClient.clear()

    // Redirect to login
    window.location.href = '/login'
  }

  // Update user profile
  const updateProfile = (updatedUser: Partial<User>) => {
    if (authState.user) {
      const updated = { ...authState.user, ...updatedUser }
      setAuthState(prev => ({ ...prev, user: updated }))

      // Update localStorage
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const authData = JSON.parse(stored)
        authData.user = updated
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
      }
    }
  }

  return {
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    updateProfile,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}