import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PlusCircle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, API_STATUSES } from '../data/mock'
import * as api from '../services/api'
import { fmtId, fmtDate, StatusBadge } from '../components/Shared'

const PER_PAGE = 8

export default function Requests() {
  const { isAgent, user } = useApp()
  const [params, setParams] = useSearchParams()
  const initialStatus = params.get('status')
  const [q, setQ] = useState(params.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [status, setStatus] = useState(API_STATUSES.includes(initialStatus) ? initialStatus : '')
  // filtros iniciais vindos da URL (ex.: clique num card do dashboard)
  const [categoryId, setCategoryId] = useState(params.get('categoriaId') || '')
  const [assigneeId, setAssigneeId] = useState(params.get('atendente') || '') // '' = todos · 'none' = sem atendente · id
  const [from, setFrom] = useState(params.get('dataInicio') || '')
  const [to, setTo] = useState(params.get('dataFim') || '')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const invalidRange = from && to && to < from

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  // busca dinâmica: debounce de ~300 ms; campo vazio não envia `q`
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (invalidRange) return
    let cancelled = false
    setLoading(true)
    api
      .listRequests({ status, categoryId, q: debouncedQ, from, to })
      .then((r) => {
        if (cancelled) return
        setList(r)
        setError('')
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [status, categoryId, debouncedQ, from, to, invalidRange])

  // A API ainda não filtra por atendente: o filtro é aplicado aqui, sobre o resultado já filtrado pelo servidor.
  // Trocar por um parâmetro de query quando o contrato oferecer.
  const visible = list.filter((r) =>
    !assigneeId ? true : assigneeId === 'none' ? r.assigneeId === null : String(r.assigneeId) === assigneeId,
  )
  // "Meus" = o próprio atendente logado, sempre primeiro e com o nome dele; depois os demais
  const others = new Map(list.filter((r) => r.assigneeId !== null && r.assigneeId !== user.id).map((r) => [String(r.assigneeId), r.assignee]))
  const assignees = [...(isAgent ? [[String(user.id), user.name]] : []), ...others]
  if (assigneeId && assigneeId !== 'none' && !assignees.some(([id]) => id === assigneeId)) assignees.push([assigneeId, 'Atendente selecionado'])

  const pages = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const rows = visible.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)

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
            <option value="none">Sem atendente</option>
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

        {loading ? (
          <div className="empty muted">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Inbox size={40} />
            <h3>Nenhuma solicitação encontrada</h3>
            <p className="muted">Ajuste os filtros{isAgent ? '.' : ' ou crie uma nova solicitação.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
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
          <span className="muted">{visible.length} resultado(s)</span>
          <div className="row">
            <button className="icon-btn" disabled={cur === 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={18} /></button>
            <span>{cur} / {pages}</span>
            <button className="icon-btn" disabled={cur === pages} onClick={() => setPage(cur + 1)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </>
  )
}
