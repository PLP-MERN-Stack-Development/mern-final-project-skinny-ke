import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Workspace, ApiResponse, PaginatedResponse } from '@/types'

export const useWorkspaces = () => {
  const {
    data: workspaces,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async (): Promise<Workspace[]> => {
      const response = await axios.get<PaginatedResponse<Workspace>>('/api/v1/workspaces')
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    workspaces,
    isLoading,
    error,
    refetch,
  }
}

export const useWorkspace = (workspaceId: string) => {
  const {
    data: workspace,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async (): Promise<Workspace> => {
      const response = await axios.get<ApiResponse<Workspace>>(`/api/v1/workspaces/${workspaceId}`)
      return response.data.data!
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    workspace,
    isLoading,
    error,
    refetch,
  }
}