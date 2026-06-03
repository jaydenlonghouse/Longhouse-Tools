import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchToolsForUser } from '../lib/toolsApi.js'

export function useTools() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['tools', user?.id],
    queryFn: async () => {
      const { data, error } = await fetchToolsForUser(user.id)
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(user?.id),
  })
}
