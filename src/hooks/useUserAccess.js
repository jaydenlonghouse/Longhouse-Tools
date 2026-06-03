import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchMyAccess } from '../lib/adminApi.js'
import { isDeveloper, isLeadershipOrAbove, userMaxRank } from '../lib/roles.js'

export function useUserAccess() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['userAccess', user?.id],
    queryFn: async () => {
      const { data, error } = await fetchMyAccess()
      if (error) throw error
      return data
    },
    enabled: Boolean(user?.id),
  })

  const access = query.data

  return {
    ...query,
    access,
    maxRank: userMaxRank(access),
    isDeveloper: isDeveloper(access),
    isLeadershipOrAbove: isLeadershipOrAbove(access),
    assignments: access?.assignments ?? [],
  }
}
