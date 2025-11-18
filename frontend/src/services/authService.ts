import { apiService } from './api'
import { User, LoginForm, RegisterForm } from '@/types'

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export const authService = {
  // User registration
  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData)
    return response.data!
  },

  // User login
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials)
    return response.data!
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await apiService.post<{ token: string }>('/auth/refresh', { refreshToken })
    return response.data!
  },

  // Logout
  async logout(): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>('/auth/logout')
    return response.data!
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiService.get<User>('/users/profile')
    return response.data!
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<User>('/users/profile', userData)
    return response.data!
  },

  // Update user avatar
  async updateAvatar(file: File): Promise<{ avatar: string }> {
    const response = await apiService.uploadFile('/users/avatar', file)
    return response.data!
  },

  // Change password
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<{ success: boolean }> {
    const response = await apiService.put<{ success: boolean }>('/users/change-password', data)
    return response.data!
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>('/auth/forgot-password', { email })
    return response.data!
  },

  // Reset password with token
  async resetPassword(data: {
    token: string
    newPassword: string
  }): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>('/auth/reset-password', data)
    return response.data!
  },

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>('/auth/verify-email', { token })
    return response.data!
  },
}