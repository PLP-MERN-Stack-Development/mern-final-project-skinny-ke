import { apiService } from './api'
import { Task, Comment, PaginatedResponse } from '@/types'

export interface CreateTaskData {
  title: string
  description?: string
  status?: 'todo' | 'in-progress' | 'review' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignees?: string[]
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
  dependencies?: string[]
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export interface TaskFilters {
  status?: string[]
  priority?: string[]
  assignee?: string[]
  tags?: string[]
  dueDate?: {
    start?: string
    end?: string
  }
  createdBy?: string
  workspace?: string
}

export const taskService = {
  // Get tasks for a workspace
  async getTasks(
    workspaceId: string,
    params?: {
      page?: number
      limit?: number
      filters?: TaskFilters
      sort?: string
      search?: string
    }
  ): Promise<PaginatedResponse<Task>> {
    const response = await apiService.get<PaginatedResponse<Task>>(`/workspaces/${workspaceId}/tasks`, { params })
    return response.data!
  },

  // Get single task
  async getTask(taskId: string): Promise<Task> {
    const response = await apiService.get<Task>(`/tasks/${taskId}`)
    return response.data!
  },

  // Create new task
  async createTask(workspaceId: string, data: CreateTaskData): Promise<Task> {
    const response = await apiService.post<Task>(`/workspaces/${workspaceId}/tasks`, data)
    return response.data!
  },

  // Update task
  async updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
    const response = await apiService.put<Task>(`/tasks/${taskId}`, data)
    return response.data!
  },

  // Delete task
  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`/tasks/${taskId}`)
    return response.data!
  },

  // Update task status
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    const response = await apiService.patch<Task>(`/tasks/${taskId}/status`, { status })
    return response.data!
  },

  // Assign task to users
  async assignTask(taskId: string, userIds: string[]): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/assign`, { userIds })
    return response.data!
  },

  // Unassign task from user
  async unassignTask(taskId: string, userId: string): Promise<Task> {
    const response = await apiService.delete<Task>(`/tasks/${taskId}/assign/${userId}`)
    return response.data!
  },

  // Add task dependency
  async addDependency(taskId: string, dependencyId: string): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/dependencies`, { dependencyId })
    return response.data!
  },

  // Remove task dependency
  async removeDependency(taskId: string, dependencyId: string): Promise<Task> {
    const response = await apiService.delete<Task>(`/tasks/${taskId}/dependencies/${dependencyId}`)
    return response.data!
  },

  // Add task subtask
  async addSubtask(taskId: string, data: { title: string; assignedTo?: string }): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/subtasks`, data)
    return response.data!
  },

  // Update subtask
  async updateSubtask(taskId: string, subtaskId: string, data: { title?: string; completed?: boolean; assignedTo?: string }): Promise<Task> {
    const response = await apiService.put<Task>(`/tasks/${taskId}/subtasks/${subtaskId}`, data)
    return response.data!
  },

  // Delete subtask
  async deleteSubtask(taskId: string, subtaskId: string): Promise<Task> {
    const response = await apiService.delete<Task>(`/tasks/${taskId}/subtasks/${subtaskId}`)
    return response.data!
  },

  // Get task comments
  async getComments(taskId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Comment>> {
    const response = await apiService.get<PaginatedResponse<Comment>>(`/tasks/${taskId}/comments`, { params })
    return response.data!
  },

  // Add comment to task
  async addComment(taskId: string, data: { content: string; mentions?: string[] }): Promise<Comment> {
    const response = await apiService.post<Comment>(`/tasks/${taskId}/comments`, data)
    return response.data!
  },

  // Update comment
  async updateComment(taskId: string, commentId: string, content: string): Promise<Comment> {
    const response = await apiService.put<Comment>(`/tasks/${taskId}/comments/${commentId}`, { content })
    return response.data!
  },

  // Delete comment
  async deleteComment(taskId: string, commentId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`/tasks/${taskId}/comments/${commentId}`)
    return response.data!
  },

  // Add reaction to comment
  async addCommentReaction(taskId: string, commentId: string, emoji: string): Promise<Comment> {
    const response = await apiService.post<Comment>(`/tasks/${taskId}/comments/${commentId}/reactions`, { emoji })
    return response.data!
  },

  // Remove reaction from comment
  async removeCommentReaction(taskId: string, commentId: string, emoji: string): Promise<Comment> {
    const response = await apiService.delete<Comment>(`/tasks/${taskId}/comments/${commentId}/reactions`, { data: { emoji } })
    return response.data!
  },

  // Upload attachment to task
  async uploadAttachment(taskId: string, file: File, onProgress?: (progress: number) => void): Promise<{ attachment: any }> {
    const response = await apiService.uploadFile(`/tasks/${taskId}/attachments`, file, onProgress)
    return response.data!
  },

  // Delete attachment
  async deleteAttachment(taskId: string, attachmentId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`/tasks/${taskId}/attachments/${attachmentId}`)
    return response.data!
  },

  // Get task activity log
  async getActivityLog(taskId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await apiService.get<PaginatedResponse<any>>(`/tasks/${taskId}/activity`, { params })
    return response.data!
  },

  // Duplicate task
  async duplicateTask(taskId: string, data?: { title?: string; assignees?: string[] }): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/duplicate`, data)
    return response.data!
  },

  // Move task to different workspace
  async moveTask(taskId: string, workspaceId: string): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/move`, { workspaceId })
    return response.data!
  },

  // Archive task
  async archiveTask(taskId: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(`/tasks/${taskId}/archive`)
    return response.data!
  },

  // Restore archived task
  async restoreTask(taskId: string): Promise<Task> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/restore`)
    return response.data!
  },

  // Get task statistics
  async getTaskStatistics(workspaceId: string, dateRange?: { start: string; end: string }): Promise<{
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    averageCompletionTime: number
    tasksByPriority: Record<string, number>
    tasksByStatus: Record<string, number>
  }> {
    const response = await apiService.get<{
      totalTasks: number
      completedTasks: number
      overdueTasks: number
      averageCompletionTime: number
      tasksByPriority: Record<string, number>
      tasksByStatus: Record<string, number>
    }>(`/workspaces/${workspaceId}/tasks/statistics`, { params: dateRange })
    return response.data!
  },

  // Bulk update tasks
  async bulkUpdateTasks(taskIds: string[], data: UpdateTaskData): Promise<{ updated: number; failed: string[] }> {
    const response = await apiService.post<{ updated: number; failed: string[] }>(`/tasks/bulk-update`, { taskIds, data })
    return response.data!
  },

  // Bulk delete tasks
  async bulkDeleteTasks(taskIds: string[]): Promise<{ deleted: number; failed: string[] }> {
    const response = await apiService.post<{ deleted: number; failed: string[] }>(`/tasks/bulk-delete`, { taskIds })
    return response.data!
  },
}