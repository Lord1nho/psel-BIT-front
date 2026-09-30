// Camada de acesso à API (contrato em docs/api.md). Converte os payloads em
// português da API para o formato usado pelas telas.
import { request, session } from './http'
import { MOCK_DASHBOARD_REQUESTS } from '../data/mock'

const toUser = (u) => ({ id: u.id, name: u.nome, username: u.usuario, role: u.perfil })

const toListItem = (r) => ({
  id: r.codigo,
  title: r.titulo,
  status: r.status,
  createdAt: r.dataCriacao,
  category: r.categoria?.nome,
  requester: r.solicitante?.nome,
  requesterId: r.solicitante?.id,
})

const toDetail = (r) => ({
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

/** GET /solicitacoes — filtros: status, categoryId, q, from, to (AAAA-MM-DD) */
export async function listRequests({ status, categoryId, q, from, to } = {}) {
  const data = await request('/solicitacoes', {
    query: { status, categoriaId: categoryId, q: q?.trim(), dataInicio: from, dataFim: to },
  })
  return data.map(toListItem)
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
 * Dashboard (UC07) — MOCK. Endpoint ainda não publicado (docs/api.md §10).
 * Quando existir (sugestão: GET /dashboard?dataInicio&dataFim&categoriaId, só ATENDENTE),
 * trocar o corpo por: `return request('/dashboard', { query: { dataInicio: from, dataFim: to, categoriaId: categoryId } })`
 * mantendo este formato de retorno.
 */
export async function getDashboard({ from, to, categoryId } = {}) {
  await new Promise((r) => setTimeout(r, 350))
  const day = (iso) => iso.slice(0, 10)
  const rows = MOCK_DASHBOARD_REQUESTS.filter(
    (r) =>
      (!from || day(r.dataCriacao) >= from) &&
      (!to || day(r.dataCriacao) <= to) &&
      (!categoryId || r.categoriaId === Number(categoryId)),
  )
  const count = (st, list = rows) => list.filter((r) => r.status === st).length

  const cats = {}
  const days = {}
  rows.forEach((r) => {
    cats[r.categoria] ||= { categoria: r.categoria, abertas: 0, emAtendimento: 0, concluidas: 0 }
    const c = cats[r.categoria]
    if (r.status === 'ABERTO') c.abertas++
    else if (r.status === 'EM_ATENDIMENTO') c.emAtendimento++
    else c.concluidas++
    const d = day(r.dataCriacao)
    days[d] ||= { data: d, criadas: 0, concluidas: 0 }
    days[d].criadas++
    if (r.status === 'CONCLUIDO') days[d].concluidas++
  })

  return {
    total: rows.length,
    abertas: count('ABERTO'),
    emAtendimento: count('EM_ATENDIMENTO'),
    concluidas: count('CONCLUIDO'),
    porCategoria: Object.values(cats),
    porDia: Object.values(days).sort((a, b) => a.data.localeCompare(b.data)),
  }
}
