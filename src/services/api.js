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

// O detalhe devolve `atendente` ({ id, nome }). O histórico fica como alternativa: respostas de
// criar/editar não trazem `atendente`, e o responsável é quem colocou o chamado em atendimento.
const assigneeFromHistory = (history = []) =>
  [...history].reverse().find((h) => h.statusNovo === 'EM_ATENDIMENTO')?.usuario ?? null

const toDetail = (r) => ({
  assignee: (r.atendente ?? assigneeFromHistory(r.historico))?.nome ?? null,
  assigneeId: (r.atendente ?? assigneeFromHistory(r.historico))?.id ?? null,
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
 * `assignee`: 'meus' (só atendente), 'sem' (ninguém assumiu) ou 'todos'/omitido (sem filtro).
 * `from`/`to`: AAAA-MM-DD. `page` (>= 1) e `size` (1 a 100).
 * Retorna { items, total, page, size, totalPages }.
 */
export async function listRequests({ statuses, categoryId, assignee, q, from, to, page = 1, size = 20 } = {}) {
  const data = await request('/solicitacoes', {
    query: {
      status: statuses,
      categoriaId: categoryId,
      atendente: assignee,
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

// ---- Comentários (docs/api.md, seção 11) ----
const toComment = (c) => ({
  id: c.id,
  text: c.texto,
  createdAt: c.dataCriacao,
  editedAt: c.dataEdicao,
  author: { id: c.autor?.id, name: c.autor?.nome, role: c.autor?.perfil },
})

const COMMENT_PAGE = 50

/** GET /solicitacoes/:codigo/comentarios — `after` é o cursor (só traz comentários posteriores). */
export async function listComments(id, { after, limit = COMMENT_PAGE } = {}) {
  const data = await request(`/solicitacoes/${id}/comentarios`, { query: { proxComentario: after, limite: limit } })
  return { items: data.itens.map(toComment), total: data.total, cursor: data.proxComentario }
}

/** Conversa inteira: repete com o cursor até vir menos que o limite. */
export async function listAllComments(id) {
  let page = await listComments(id)
  const items = [...page.items]
  while (page.items.length === COMMENT_PAGE) {
    page = await listComments(id, { after: page.cursor })
    items.push(...page.items)
  }
  return { items, cursor: page.cursor }
}

/** POST — como atendente num chamado ABERTO, comentar assume o chamado. */
export const createComment = async (id, text) =>
  toComment(await request(`/solicitacoes/${id}/comentarios`, { method: 'POST', body: { texto: text } }))

/** PATCH — só o autor */
export const updateComment = async (id, commentId, text) =>
  toComment(await request(`/solicitacoes/${id}/comentarios/${commentId}`, { method: 'PATCH', body: { texto: text } }))

/** DELETE — só o autor; definitivo */
export const deleteComment = (id, commentId) => request(`/solicitacoes/${id}/comentarios/${commentId}`, { method: 'DELETE' })
