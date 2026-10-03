import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '../services/api'
import { queryClient } from '../queryClient'

const POLL_MS = 15_000

// Conversa de um chamado. Carrega tudo ao abrir; depois, a cada 15 s (aba visível), pede só o que veio
// depois do cursor e acrescenta ao fim. Edições/exclusões de terceiros aparecem ao recarregar (foco da aba).
// As ações do próprio usuário são aplicadas direto no cache.
export function useComments(id, { live = true } = {}) {
  const key = ['comments', String(id)]
  const { data, error, isPending, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.listAllComments(id),
    staleTime: POLL_MS,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
  })

  const cursor = data?.cursor
  const loaded = !!data
  useEffect(() => {
    if (!live || !loaded) return
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      const current = queryClient.getQueryData(key)
      if (!current) return
      try {
        const news = await api.listComments(id, { after: current.cursor })
        if (!news.items.length) return
        queryClient.setQueryData(key, (old) => {
          if (!old) return old
          const known = new Set(old.items.map((c) => c.id))
          const fresh = news.items.filter((c) => !known.has(c.id))
          return { items: [...old.items, ...fresh], cursor: news.cursor ?? old.cursor }
        })
      } catch {
        // falha de polling é silenciosa: tenta de novo no próximo ciclo
      }
    }, POLL_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, live, loaded, cursor])

  const patch = (fn) => queryClient.setQueryData(key, (old) => (old ? { ...old, items: fn(old.items) } : old))

  return {
    comments: data?.items ?? [],
    loading: isPending,
    error,
    reload: refetch,
    async add(text) {
      const c = await api.createComment(id, text)
      queryClient.setQueryData(key, (old) => ({
        items: [...(old?.items ?? []).filter((x) => x.id !== c.id), c],
        cursor: Math.max(old?.cursor ?? 0, c.id),
      }))
      return c
    },
    async edit(commentId, text) {
      const c = await api.updateComment(id, commentId, text)
      patch((items) => items.map((x) => (x.id === c.id ? c : x)))
    },
    async remove(commentId) {
      await api.deleteComment(id, commentId)
      patch((items) => items.filter((x) => x.id !== commentId))
    },
  }
}
