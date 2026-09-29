export const STATUS = {
  aberta: { label: 'Aberta', color: '#337AB7' },
  andamento: { label: 'Em andamento', color: '#3EC1D5' },
  aguardando: { label: 'Aguardando', color: '#F0A030' },
  concluida: { label: 'Concluída', color: '#3BA55D' },
}

export const PRIORITY = {
  baixa: { label: 'Baixa', color: '#8A94A6' },
  media: { label: 'Média', color: '#337AB7' },
  alta: { label: 'Alta', color: '#F0A030' },
  critica: { label: 'Crítica', color: '#E5322D' },
}

export const CATEGORIES = ['TI / Suporte', 'Infraestrutura', 'RH', 'Financeiro', 'Compras', 'Facilities']

export const USERS = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Alves', 'Elisa Rocha']

export const CURRENT_USER = 'Luiz Fernando'

const d = (days) => new Date(Date.now() - days * 86400000).toISOString()

export const INITIAL_REQUESTS = [
  ['Notebook não liga após atualização', 'TI / Suporte', 'alta', 'andamento', 'Ana Souza', 'Marcos Paiva', 1],
  ['Solicitação de acesso à VPN', 'Infraestrutura', 'media', 'aberta', null, CURRENT_USER, 0],
  ['Reembolso de despesas de viagem', 'Financeiro', 'baixa', 'aguardando', 'Carla Mendes', 'Paula Nunes', 3],
  ['Servidor de arquivos fora do ar', 'Infraestrutura', 'critica', 'andamento', 'Bruno Lima', 'Rafael Costa', 0],
  ['Atualização de dados cadastrais', 'RH', 'baixa', 'concluida', 'Elisa Rocha', CURRENT_USER, 6],
  ['Compra de monitores adicionais', 'Compras', 'media', 'aguardando', 'Diego Alves', 'Tânia Reis', 4],
  ['Ar-condicionado da sala 2 com ruído', 'Facilities', 'media', 'aberta', null, 'João Pedro', 2],
  ['Erro ao emitir nota fiscal', 'Financeiro', 'alta', 'andamento', 'Carla Mendes', CURRENT_USER, 1],
  ['Instalação do Office em nova máquina', 'TI / Suporte', 'baixa', 'concluida', 'Ana Souza', 'Lívia Teles', 8],
  ['Solicitação de férias — setembro', 'RH', 'baixa', 'concluida', 'Elisa Rocha', CURRENT_USER, 10],
  ['Impressora do 3º andar sem toner', 'Facilities', 'baixa', 'aberta', null, 'Marcos Paiva', 0],
  ['Lentidão na rede Wi-Fi', 'Infraestrutura', 'alta', 'aberta', null, 'Paula Nunes', 1],
].map(([title, category, priority, status, assignee, requester, age], i) => ({
  id: i + 1,
  title,
  category,
  priority,
  status,
  assignee,
  requester,
  createdAt: d(age),
  description:
    'Descrição detalhada da demanda. O colaborador relata o problema, o impacto no trabalho e o que já foi tentado até o momento.',
  history: [
    { type: 'event', author: requester, text: 'abriu a solicitação', at: d(age) },
    ...(assignee ? [{ type: 'event', author: assignee, text: 'assumiu a solicitação', at: d(Math.max(age - 0.5, 0)) }] : []),
    ...(age > 1
      ? [{ type: 'comment', author: assignee || 'Suporte', text: 'Estamos analisando o caso e retornamos em breve.', at: d(age - 1) }]
      : []),
  ],
}))
