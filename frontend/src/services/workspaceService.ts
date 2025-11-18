import { apiService } from './api'
import { Workspace, WorkspaceMember, PaginatedResponse } from '@/types'

export interface CreateWorkspaceData {
  name: string
  description?: string
  settings?: {
    isPublic?: boolean
    allowGuestAccess?: boolean
    defaultTaskView?: 'kanban' | 'list' | 'calendar'
  }
  branding?: {
    primaryColor?: string
    logo?: string
  }
}

export interface UpdateWorkspaceData extends Partial<CreateWorkspaceData> {}

export const workspaceService = {
  // Get all workspaces for current user
  async getWorkspaces(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedResponse<Workspace>> {
    const response = await apiService.get<PaginatedResponse<Workspace>>('/workspaces', { params })
    return response.data!
  },

  // Get single workspace by ID or slug
  async getWorkspace(id: string): Promise<Workspace> {
    const response = await apiService.get<Workspace>(`/workspaces/${id}`)
    return response.data!
  },

  // Create new workspace
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const response = await apiService.post<Workspace>('/workspaces', data)
    return response.data!
  },

  // Update workspace
  async updateWorkspace(id: string, data: UpdateWorkspaceData): Promise<Workspace> {
    const response = await apiService.put<Workspace>(`/workspaces/${id}`, data)
    return response.data!
  },

  // Delete workspace
  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`/workspaces/${id}`)
    return response.data!
  },

  // Add member to workspace
  async addMember(workspaceId: string, data: {
    email: string
    role?: 'admin' | 'manager' | 'member'
  }): Promise<WorkspaceMember> {
    const response = await apiService.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, data)
    return response.data!
  },

  // Update member role
  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'manager' | 'member'): Promise<WorkspaceMember> {
    const response = await apiService.put<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, { role })
    return response.data!
  },

  // Remove member from workspace
  async removeMember(workspaceId: string, userId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`/workspaces/${workspaceId}/members/${userId}`)
    return response.data!
  },

  // Get workspace members
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiService.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
    return response.data!
  },

  // Invite users to workspace
  async inviteUsers(workspaceId: string, emails: string[]): Promise<{ invited: string[]; failed: string[] }> {
    const response = await apiService.post<{ invited: string[]; failed: string[] }>(`/workspaces/${workspaceId}/invites`, { emails })
    return response.data!
  },

  // Accept workspace invitation
  async acceptInvitation(token: string): Promise<{ workspace: Workspace; member: WorkspaceMember }> {
    const response = await apiService.post<{ workspace: Workspace; member: WorkspaceMember }>(`/workspaces/invites/${token}/accept`)
    return response.data!
  },

  // Decline workspace invitation
  async declineInvitation(token: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(`/workspaces/invites/${token}/decline`)
    return response.data!
  },

  // Update workspace branding
  async updateBranding(workspaceId: string, branding: {
    primaryColor?: string
    logo?: File
  }): Promise<{ branding: Workspace['branding'] }> {
    const formData = new FormData()
    if (branding.primaryColor) formData.append('primaryColor', branding.primaryColor)
    if (branding.logo) formData.append('logo', branding.logo)

    const response = await apiService.uploadFile(`/workspaces/${workspaceId}/branding`, branding.logo!)
    return response.data!
  },

  // Get workspace statistics
  async getStatistics(workspaceId: string, dateRange?: {
    start: string
    end: string
  }): Promise<{
    totalTasks: number
    completedTasks: number
    activeMembers: number
    completionRate: number
    averageTaskTime: number
  }> {
    const response = await apiService.get<{
      totalTasks: number
      completedTasks: number
      activeMembers: number
      completionRate: number
      averageTaskTime: number
    }>(`/workspaces/${workspaceId}/statistics`, { params: dateRange })
    return response.data!
  },

  // Export workspace data
  async exportData(workspaceId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiService.get(`/workspaces/${workspaceId}/export?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Archive workspace
  async archiveWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(`/workspaces/${workspaceId}/archive`)
    return response.data!
  },

  // Restore archived workspace
  async restoreWorkspace(workspaceId: string): Promise<Workspace> {
    const response = await apiService.post<Workspace>(`/workspaces/${workspaceId}/restore`)
    return response.data!
  },
}