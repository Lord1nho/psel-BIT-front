import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PlusCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, API_STATUSES } from '../data/mock'
import * as api from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { fmtId, fmtDate, StatusBadge } from '../components/Shared'

const SIZES = [10, 20, 50]

// '' = todos os status (padrão) · ou um único status
const statusFromUrl = (s) => (API_STATUSES.includes(s) ? s : '')

export default function Requests() {
  const { isAgent, user } = useApp()
  const { categories } = useCategories()
  const [params, setParams] = useSearchParams()
  // filtros iniciais vindos da URL (ex.: clique num card do dashboard)
  const [q, setQ] = useState(params.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [status, setStatus] = useState(statusFromUrl(params.get('status')))
  const [categoryId, setCategoryId] = useState(params.get('categoriaId') || '')
  const [assigneeId, setAssigneeId] = useState(/^\d+$/.test(params.get('atendente') || '') ? params.get('atendente') : '')
  const [from, setFrom] = useState(params.get('dataInicio') || '')
  const [to, setTo] = useState(params.get('dataFim') || '')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [known, setKnown] = useState({}) // atendentes já vistos nos resultados: { id: nome }
  const [data, setData] = useState(null) // { items, total, page, size, totalPages }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const invalidRange = from && to && to < from

  // busca dinâmica: debounce de ~300 ms; campo vazio não envia `q`
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // Filtros e paginação rodam no servidor; cada mudança refaz a consulta
  useEffect(() => {
    if (invalidRange) return
    let cancelled = false
    setLoading(true)
    api
      .listRequests({ statuses: status || undefined, categoryId, assigneeId, q: debouncedQ, from, to, page, size })
      .then((r) => {
        if (cancelled) return
        // página além do fim (ex.: depois de mudar um filtro): volta para a última existente
        if (r.items.length === 0 && r.totalPages > 0 && page > r.totalPages) return setPage(r.totalPages)
        setData(r)
        setError('')
        setKnown((k) => {
          const next = { ...k }
          r.items.forEach((i) => i.assigneeId !== null && (next[i.assigneeId] = i.assignee))
          return next
        })
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [status, categoryId, assigneeId, debouncedQ, from, to, page, size, invalidRange])

  // "Meus" = o próprio atendente logado, sempre primeiro e com o nome dele; depois os demais já vistos
  const assignees = Object.entries(known).filter(([id]) => Number(id) !== user.id)
  if (isAgent) assignees.unshift([String(user.id), user.name])
  if (assigneeId && !assignees.some(([id]) => id === assigneeId)) assignees.push([assigneeId, 'Atendente selecionado'])

  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(data?.totalPages ?? 1, 1)
  const first = total ? (page - 1) * size + 1 : 0
  const last = first ? first + rows.length - 1 : 0

  const change = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }
  const clear = () => {
    setQ('')
    setStatus('')
    setCategoryId('')
    setAssigneeId('')
    setFrom('')
    setTo('')
    setPage(1)
    setParams({})
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Solicitações</h1>
          <p className="muted">{isAgent ? 'Todas as solicitações' : 'Suas solicitações'}</p>
        </div>
        {!isAgent && (
          <Link to="/nova" className="btn primary">
            <PlusCircle size={16} /> Nova solicitação
          </Link>
        )}
      </div>

      <div className="card table-card">
        <div className="filters">
          <label className="search grow">
            <Search size={16} />
            <input placeholder="Buscar por título, solicitante ou código" maxLength={100} value={q} onChange={change(setQ)} />
          </label>
          <select value={status} onChange={change(setStatus)}>
            <option value="">Todos os status</option>
            {API_STATUSES.map((k) => (
              <option key={k} value={k}>{STATUS[k].label}</option>
            ))}
          </select>
          <select value={categoryId} onChange={change(setCategoryId)}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <select value={assigneeId} onChange={change(setAssigneeId)}>
            <option value="">{isAgent ? 'Todos (Geral)' : 'Todos os atendentes'}</option>
            {assignees.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <label className="date-field">
            De <input type="date" value={from} onChange={change(setFrom)} />
          </label>
          <label className="date-field">
            Até <input type="date" value={to} min={from || undefined} onChange={change(setTo)} />
          </label>
          <button className="btn ghost" onClick={clear}>Limpar</button>
        </div>
        {invalidRange && <p className="error pad">A data final não pode ser anterior à inicial.</p>}
        {error && <p className="error pad">{error}</p>}

        {!data && loading ? (
          <div className="empty muted">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Inbox size={40} />
            <h3>Nenhuma solicitação encontrada</h3>
            <p className="muted">Ajuste os filtros{isAgent ? '.' : ' ou crie uma nova solicitação.'}</p>
          </div>
        ) : (
          <div className={loading ? 'table-wrap loading' : 'table-wrap'}>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Solicitante</th>
                  <th>Atendente</th>
                  <th>Abertura</th>
                  <th>Última atualização</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="muted">{fmtId(r.id)}</td>
                    <td><Link to={`/solicitacoes/${r.id}`} className="title-link">{r.title}</Link></td>
                    <td>{r.category}</td>
                    <td>{r.requester}</td>
                    <td>{r.assignee || <span className="muted">Sem atendente</span>}</td>
                    <td className="muted">{fmtDate(r.createdAt)}</td>
                    <td className="muted">{r.updatedAt ? fmtDate(r.updatedAt) : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <span className="muted">{total ? `Mostrando ${first}–${last} de ${total}` : '0 resultados'}</span>
          <div className="row">
            <label className="size-field muted">
              Por página
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1) }}>
                {SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="icon-btn" aria-label="Primeira página" disabled={page <= 1 || loading} onClick={() => setPage(1)}><ChevronsLeft size={18} /></button>
            <button className="icon-btn" aria-label="Página anterior" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
            <span>{page} / {totalPages}</span>
            <button className="icon-btn" aria-label="Próxima página" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
            <button className="icon-btn" aria-label="Última página" disabled={page >= totalPages || loading} onClick={() => setPage(totalPages)}><ChevronsRight size={18} /></button>
          </div>
        </div>
      </div>
    </>
  )
}
