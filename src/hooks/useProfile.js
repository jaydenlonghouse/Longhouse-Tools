import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchProfile } from '../lib/toolsApi.js'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await fetchProfile(user.id)
      if (error) throw error
      return data
    },
    enabled: Boolean(user?.id),
  })
}
