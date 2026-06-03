import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFeatureRequests } from '../lib/featuresApi.js'

export function useFeatureRequests(toolId) {
  return useQuery({
    queryKey: ['feature-requests', toolId],
    queryFn: async () => {
      const { data, error } = await fetchFeatureRequests(toolId)
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(toolId),
  })
}

export function useInvalidateFeatureRequests() {
  const queryClient = useQueryClient()
  return toolId => {
    if (toolId) {
      queryClient.invalidateQueries({ queryKey: ['feature-requests', toolId] })
    }
  }
}
