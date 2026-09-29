import { Link } from 'react-router-dom'
import { Inbox, Loader, PauseCircle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, CATEGORIES } from '../data/mock'
import { fmtId, fmtDate, StatusBadge } from '../components/Shared'

const ICONS = { aberta: Inbox, andamento: Loader, aguardando: PauseCircle, concluida: CheckCircle2 }

export default function Dashboard() {
  const { requests } = useApp()
  const count = (fn) => requests.filter(fn).length
  const max = Math.max(...CATEGORIES.map((c) => count((r) => r.category === c)), 1)
  const recent = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Visão geral das solicitações internas</p>
        </div>
      </div>

      <div className="grid kpis">
        {Object.entries(STATUS).map(([key, s]) => {
          const Icon = ICONS[key]
          return (
            <Link to={`/solicitacoes?status=${key}`} className="card kpi" key={key} style={{ '--c': s.color }}>
              <span className="kpi-icon">
                <Icon size={22} />
              </span>
              <div>
                <strong>{count((r) => r.status === key)}</strong>
                <span>{s.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid two">
        <section className="card">
          <h3>Solicitações por status</h3>
          <div className="stack-bar">
            {Object.entries(STATUS).map(([k, s]) => (
              <i key={k} style={{ flex: count((r) => r.status === k) || 0, background: s.color }} title={s.label} />
            ))}
          </div>
          <ul className="legend">
            {Object.entries(STATUS).map(([k, s]) => (
              <li key={k}>
                <i className="dot" style={{ background: s.color }} /> {s.label}
                <b>{count((r) => r.status === k)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>Por categoria</h3>
          {CATEGORIES.map((c) => {
            const n = count((r) => r.category === c)
            return (
              <div className="hbar" key={c}>
                <span>{c}</span>
                <div>
                  <i style={{ width: `${(n / max) * 100}%` }} />
                </div>
                <b>{n}</b>
              </div>
            )
          })}
        </section>
      </div>

      <section className="card">
        <div className="row between">
          <h3>Atividade recente</h3>
          <Link to="/solicitacoes">Ver todas</Link>
        </div>
        <ul className="activity">
          {recent.map((r) => (
            <li key={r.id}>
              <Link to={`/solicitacoes/${r.id}`}>
                <span className="muted">{fmtId(r.id)}</span> {r.title}
              </Link>
              <span className="muted hide-sm">{fmtDate(r.createdAt)}</span>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
