// Camada de acesso à API (contrato em docs/api.md). Converte os payloads em
// português da API para o formato usado pelas telas.
import { request, session } from './http'

const toUser = (u) => ({ id: u.id, name: u.nome, username: u.usuario, role: u.perfil })

const toListItem = (r) => ({
  id: r.codigo,
  title: r.titulo,
  status: r.status,
  createdAt: r.dataCriacao,
  category: r.categoria?.nome,
  requester: r.solicitante?.nome,
  requesterId: r.solicitante?.id,
  assignee: r.atendente?.nome ?? null,
  assigneeId: r.atendente?.id ?? null,
  updatedAt: r.ultimaAtualizacao,
})

// O detalhe ainda não devolve `atendente` (só a listagem). Enquanto isso, o responsável é o último
// atendente que colocou a solicitação em atendimento, lido do histórico. Quando a API enviar
// `atendente` no detalhe, ele passa a valer automaticamente.
const assigneeFromHistory = (history = []) =>
  [...history].reverse().find((h) => h.statusNovo === 'EM_ATENDIMENTO')?.usuario?.nome ?? null

const toDetail = (r) => ({
  assignee: r.atendente?.nome ?? assigneeFromHistory(r.historico),
  id: r.codigo,
  title: r.titulo,
  description: r.descricao,
  status: r.status,
  createdAt: r.dataCriacao,
  categoryId: r.categoriaId,
  category: r.categoria?.nome,
  requesterId: r.usuarioId,
  requester: r.solicitante?.nome,
  history: (r.historico || []).map((h) => ({
    from: h.statusAnterior,
    to: h.statusNovo,
    at: h.dataAlteracao,
    author: h.usuario?.nome,
  })),
})

/** POST /auth/login */
export async function login({ usuario, senha }) {
  const data = await request('/auth/login', { method: 'POST', body: { usuario, senha }, auth: false })
  const user = toUser(data.usuario)
  session.set({ accessToken: data.accessToken, user })
  return user
}

/** POST /auth/logout — stateless: o token é apenas descartado localmente. */
export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' })
  } catch {
    // o token é descartado de qualquer forma
  } finally {
    session.clear()
  }
}

/** GET /categorias */
export const getCategories = () => request('/categorias')

/**
 * GET /solicitacoes — filtros e paginação no servidor.
 * `statuses`: um ou vários separados por vírgula (ex.: 'ABERTO,EM_ATENDIMENTO'); omitido = todos.
 * `from`/`to`: AAAA-MM-DD. `page` (>= 1) e `size` (1 a 100).
 * Retorna { items, total, page, size, totalPages }.
 */
export async function listRequests({ statuses, categoryId, assigneeId, q, from, to, page = 1, size = 20 } = {}) {
  const data = await request('/solicitacoes', {
    query: {
      status: statuses,
      categoriaId: categoryId,
      atendenteId: assigneeId,
      q: q?.trim(),
      dataInicio: from,
      dataFim: to,
      pagina: page,
      tamanho: size,
    },
  })
  return {
    items: data.itens.map(toListItem),
    total: data.total,
    page: data.pagina,
    size: data.tamanho,
    totalPages: data.totalPaginas,
  }
}

/** GET /solicitacoes/:codigo */
export const getRequest = async (id) => toDetail(await request(`/solicitacoes/${id}`))

/** POST /solicitacoes */
export async function createRequest({ title, description, categoryId }) {
  const data = await request('/solicitacoes', {
    method: 'POST',
    body: { titulo: title, descricao: description, categoriaId: Number(categoryId) },
  })
  return toDetail(data)
}

/** PATCH /solicitacoes/:codigo — envia apenas os campos alterados */
export async function updateRequest(id, { title, description, categoryId }) {
  const body = {}
  if (title !== undefined) body.titulo = title
  if (description !== undefined) body.descricao = description
  if (categoryId !== undefined) body.categoriaId = Number(categoryId)
  return toDetail(await request(`/solicitacoes/${id}`, { method: 'PATCH', body }))
}

/** DELETE /solicitacoes/:codigo */
export const deleteRequest = (id) => request(`/solicitacoes/${id}`, { method: 'DELETE' })

/** PATCH /solicitacoes/:codigo/status — ATENDENTE; sequência ABERTO → EM_ATENDIMENTO → CONCLUIDO */
export const updateStatus = (id, status) => request(`/solicitacoes/${id}/status`, { method: 'PATCH', body: { status } })

/**
 * GET /dashboard — SOLICITANTE (só as próprias) e ATENDENTE (todas, ou `escopo: 'meus'`).
 * Filtros: `periodo` ('tudo' | '30d' | '7d') OU `dataInicio`/`dataFim` (nunca os dois),
 * `categoriaId`, `agrupamento` ('auto' | 'dia' | 'semana' | 'mes'), `escopo` ('geral' | 'meus').
 * Retorna o payload da API sem adaptação.
 */
export function getDashboard({ periodo, dataInicio, dataFim, categoriaId, agrupamento, escopo } = {}) {
  const custom = dataInicio || dataFim
  return request('/dashboard', {
    query: {
      periodo: custom ? undefined : periodo,
      dataInicio,
      dataFim,
      categoriaId,
      agrupamento,
      escopo,
    },
  })
}
