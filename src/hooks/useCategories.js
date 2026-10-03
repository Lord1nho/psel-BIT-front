import { useQuery } from '@tanstack/react-query'
import * as api from '../services/api'

// Categorias são poucas, pequenas e quase estáticas: um cache longo, só em memória, evita refazer
// GET /categorias a cada troca de tela. Requisições idênticas em andamento são unificadas (dedupe).
// Use `enabled: false` para só ler do cache quando a lista não é necessária ainda.
export function useCategories({ enabled = true } = {}) {
  const { data, error } = useQuery({
    queryKey: ['categorias'],
    queryFn: api.getCategories,
    staleTime: 30 * 60_000, // fresco por 30 min: sem nova requisição nesse período
    gcTime: 60 * 60_000, // descartado da memória após 1 h sem uso
    enabled,
  })
  return { categories: data ?? [], error }
}
