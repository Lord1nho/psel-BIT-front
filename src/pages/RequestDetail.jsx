import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Circle, Clock } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, PRIORITY } from '../data/mock'
import { fmtId, fmtDate, StatusBadge, PriorityBadge, Avatar } from '../components/Shared'

export default function RequestDetail() {
  const { id } = useParams()
  const { requests, updateRequest, addComment, notify, isAgent, agents } = useApp()
  const [text, setText] = useState('')
  const r = requests.find((x) => x.id === Number(id))

  if (!r)
    return (
      <div className="card empty">
        <h3>Solicitação não encontrada</h3>
        <Link to="/solicitacoes">Voltar à lista</Link>
      </div>
    )

  const change = async (field, label, value, display) => {
    await updateRequest(r.id, { [field]: value || null }, `alterou ${label} para "${display}"`)
    notify('Solicitação atualizada')
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const t = text
    setText('')
    await addComment(r.id, t)
  }

  return (
    <>
      <Link to="/solicitacoes" className="back">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <div className="page-head">
        <div>
          <span className="muted">{fmtId(r.id)} · {r.category}</span>
          <h1>{r.title}</h1>
        </div>
        <div className="row">
          <PriorityBadge priority={r.priority} />
          <StatusBadge status={r.status} />
        </div>
      </div>

      <div className="detail">
        <div>
          <section className="card">
            <h3>Descrição</h3>
            <p>{r.description}</p>
          </section>

          <section className="card">
            <h3>Histórico</h3>
            <ol className="timeline">
              {r.history.map((h, i) => (
                <li key={i} className={h.type}>
                  {h.type === 'comment' ? <MessageSquare size={14} /> : <Circle size={10} />}
                  <div>
                    <div className="meta">
                      <b>{h.author}</b> {h.type === 'event' && h.text}
                      <span className="muted"> · {fmtDate(h.at)}</span>
                    </div>
                    {h.type === 'comment' && <div className="bubble">{h.text}</div>}
                  </div>
                </li>
              ))}
            </ol>
            <form onSubmit={send} className="comment-form">
              <textarea rows={3} placeholder="Escreva um comentário..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn primary">Comentar</button>
            </form>
          </section>
        </div>

        <aside className="card side">
          <h3>{isAgent ? 'Gerenciar' : 'Detalhes'}</h3>
          <label className="field">
            Status
            <select disabled={!isAgent} value={r.status} onChange={(e) => change('status', 'o status', e.target.value, STATUS[e.target.value].label)}>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            Prioridade
            <select disabled={!isAgent} value={r.priority} onChange={(e) => change('priority', 'a prioridade', e.target.value, PRIORITY[e.target.value].label)}>
              {Object.entries(PRIORITY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </label>
          <label className="field">
            Responsável
            <select disabled={!isAgent} value={r.assignee || ''} onChange={(e) => change('assignee', 'o responsável', e.target.value, e.target.value || 'ninguém')}>
              <option value="">Não atribuída</option>
              {agents.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
          <hr />
          <dl>
            <dt>Solicitante</dt>
            <dd className="row"><Avatar name={r.requester} size={24} /> {r.requester}</dd>
            <dt>Criada em</dt>
            <dd>{fmtDate(r.createdAt)}</dd>
            <dt>SLA</dt>
            <dd className="row"><Clock size={14} /> {r.status === 'concluida' ? 'Encerrada' : 'Resposta em 4h'}</dd>
          </dl>
        </aside>
      </div>
    </>
  )
}
