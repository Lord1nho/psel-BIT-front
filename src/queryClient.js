import { QueryClient } from '@tanstack/react-query'

// Usado pelo dashboard e pelas categorias (useCategories); o restante do app busca dados com useEffect.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
})

export const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
