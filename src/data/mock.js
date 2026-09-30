// Chaves iguais ao enum da API.
export const STATUS = {
  ABERTO: { label: 'Aberto', color: '#337AB7' },
  EM_ATENDIMENTO: { label: 'Em atendimento', color: '#3EC1D5' },
  CONCLUIDO: { label: 'Concluído', color: '#3BA55D' },
}

export const API_STATUSES = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO']

export const PRIORITY = {
  baixa: { label: 'Baixa', color: '#8A94A6' },
  media: { label: 'Média', color: '#337AB7' },
  alta: { label: 'Alta', color: '#F0A030' },
  critica: { label: 'Crítica', color: '#E5322D' },
}

export const ROLES = { SOLICITANTE: 'Solicitante', ATENDENTE: 'Atendente' }

// ---- Dashboard (UC07) — mock até o back publicar o endpoint ----
// Mesmas categorias/ids de GET /categorias.
const MOCK_CATEGORIES = [
  { id: 1, nome: 'TI' },
  { id: 2, nome: 'RH' },
  { id: 3, nome: 'Compras' },
  { id: 4, nome: 'Financeiro' },
  { id: 5, nome: 'Infraestrutura' },
]

// Gerador determinístico, para o painel não mudar a cada recarga.
const rand = (() => {
  let x = 42
  return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296
})()

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

export const MOCK_DASHBOARD_REQUESTS = Array.from({ length: 90 }, (_, i) => {
  const age = Math.floor(rand() * rand() * 45) // mais chamados recentes
  const r = rand()
  const cat = MOCK_CATEGORIES[Math.floor(rand() * rand() * 5)] // TI domina
  // chamados antigos tendem a estar concluídos
  const done = age > 10 ? 0.75 : age > 3 ? 0.4 : 0.1
  const status = r < done ? 'CONCLUIDO' : r < done + (1 - done) * 0.5 ? 'EM_ATENDIMENTO' : 'ABERTO'
  return { codigo: i + 1, status, categoriaId: cat.id, categoria: cat.nome, dataCriacao: daysAgo(age) }
})
