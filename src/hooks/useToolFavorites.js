import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchUserToolFavoriteIds, toggleToolFavorite } from '../lib/favoritesApi.js'

export function useToolFavorites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  const query = useQuery({
    queryKey: ['toolFavorites', userId],
    queryFn: async () => {
      const { data, error } = await fetchUserToolFavoriteIds(userId)
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(userId),
  })

  const mutation = useMutation({
    mutationFn: async ({ toolId, isFavorited }) => {
      const { error } = await toggleToolFavorite({ userId, toolId, isFavorited })
      if (error) throw error
    },
    onMutate: async ({ toolId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ['toolFavorites', userId] })
      const previous = queryClient.getQueryData(['toolFavorites', userId]) ?? []

      queryClient.setQueryData(['toolFavorites', userId], current => {
        const ids = current ?? []
        if (isFavorited) {
          return ids.filter(id => id !== toolId)
        }
        return ids.includes(toolId) ? ids : [...ids, toolId]
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['toolFavorites', userId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['toolFavorites', userId] })
    },
  })

  const favoriteIds = query.data ?? []
  const favoriteSet = new Set(favoriteIds)

  function isFavorited(toolId) {
    return favoriteSet.has(toolId)
  }

  function toggleFavorite(toolId) {
    if (!userId || mutation.isPending) return
    mutation.mutate({ toolId, isFavorited: favoriteSet.has(toolId) })
  }

  return {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    isLoading: query.isLoading,
    isToggling: mutation.isPending,
  }
}
