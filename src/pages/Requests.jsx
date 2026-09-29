import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PlusCircle, ChevronLeft, ChevronRight, Inbox, ArrowUpDown } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, PRIORITY, CATEGORIES, CURRENT_USER } from '../data/mock'
import { fmtId, fmtDate, StatusBadge, PriorityBadge, Avatar } from '../components/Shared'

const PER_PAGE = 8

export default function Requests() {
  const { requests } = useApp()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [tab, setTab] = useState('todas')
  const [desc, setDesc] = useState(true)
  const [page, setPage] = useState(1)
  const status = params.get('status') || ''

  const list = useMemo(() => {
    const s = q.toLowerCase()
    return requests
      .filter((r) => !status || r.status === status)
      .filter((r) => !priority || r.priority === priority)
      .filter((r) => !category || r.category === category)
      .filter((r) => tab !== 'minhas' || r.requester === CURRENT_USER)
      .filter((r) => tab !== 'abertas' || r.status !== 'concluida')
      .filter((r) => !s || r.title.toLowerCase().includes(s) || fmtId(r.id).includes(s))
      .sort((a, b) => (desc ? b.id - a.id : a.id - b.id))
  }, [requests, q, status, priority, category, tab, desc])

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const rows = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)
  const reset = (fn) => (e) => {
    fn(e.target.value)
    setPage(1)
  }
  const setStatus = (v) => {
    setParams(v ? { status: v } : {})
    setPage(1)
  }
  const clear = () => {
    setQ('')
    setPriority('')
    setCategory('')
    setTab('todas')
    setStatus('')
  }
  const tabs = [
    ['todas', 'Todas'],
    ['minhas', 'Minhas'],
    ['abertas', 'Em aberto'],
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Solicitações</h1>
          <p className="muted">Consulte, filtre e gerencie as demandas</p>
        </div>
        <Link to="/nova" className="btn primary">
          <PlusCircle size={16} /> Nova solicitação
        </Link>
      </div>

      <div className="card table-card">
        <div className="tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => { setTab(k); setPage(1) }}>
              {l}
            </button>
          ))}
        </div>

        <div className="filters">
          <label className="search grow">
            <Search size={16} />
            <input placeholder="Buscar por título ou #ID" value={q} onChange={reset(setQ)} />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
          <select value={priority} onChange={reset(setPriority)}>
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY).map(([k, p]) => (
              <option key={k} value={k}>{p.label}</option>
            ))}
          </select>
          <select value={category} onChange={reset(setCategory)}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="btn ghost" onClick={clear}>Limpar</button>
        </div>

        {rows.length === 0 ? (
          <div className="empty">
            <Inbox size={40} />
            <h3>Nenhuma solicitação encontrada</h3>
            <p className="muted">Ajuste os filtros ou crie uma nova solicitação.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th onClick={() => setDesc(!desc)} className="sortable">
                    ID <ArrowUpDown size={12} />
                  </th>
                  <th>Assunto</th>
                  <th>Solicitante</th>
                  <th>Categoria</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  <th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="muted">{fmtId(r.id)}</td>
                    <td><Link to={`/solicitacoes/${r.id}`} className="title-link">{r.title}</Link></td>
                    <td>{r.requester}</td>
                    <td>{r.category}</td>
                    <td><PriorityBadge priority={r.priority} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.assignee ? (
                        <span className="row"><Avatar name={r.assignee} size={24} /> {r.assignee}</span>
                      ) : (
                        <span className="muted">Não atribuída</span>
                      )}
                    </td>
                    <td className="muted">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <span className="muted">{list.length} resultado(s)</span>
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
