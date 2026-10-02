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
