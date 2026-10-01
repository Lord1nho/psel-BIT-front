import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Circle, Clock, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, PRIORITY } from '../data/mock'
import * as api from '../services/api'
import { invalidateDashboard } from '../queryClient'
import { useAction } from '../hooks/useAction'
import { fmtId, fmtDate, StatusBadge, Avatar } from '../components/Shared'

export default function RequestDetail() {
  const { id } = useParams()
  const { user, isAgent, notify } = useApp()
  const nav = useNavigate()
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [run, busy] = useAction()
  const [newStatus, setNewStatus] = useState(null)

  useEffect(() => {
    let cancelled = false
    setR(null)
    setError(null)
    api
      .getRequest(id)
      .then((d) => !cancelled && setR(d))
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [id])

  if (error)
    return (
      <div className="card empty">
        <h3>{error.status === 404 ? 'Solicitação não encontrada' : error.status === 403 ? 'Sem acesso a esta solicitação' : 'Erro ao carregar'}</h3>
        <p className="muted">{error.message}</p>
        <Link to="/solicitacoes">Voltar à lista</Link>
      </div>
    )
  if (!r) return <p className="muted">Carregando...</p>

  // o servidor valida de qualquer forma; aqui só decidimos o que mostrar
  const canManage = !isAgent && r.status === 'ABERTO' && r.requesterId === user.id

  const startEdit = async () => {
    setForm({ title: r.title, description: r.description, categoryId: r.categoryId })
    setFormError('')
    setEditing(true)
    if (!categories.length) api.getCategories().then(setCategories).catch(() => {})
  }

  const save = async (e) => {
    e.preventDefault()
    const patch = {}
    if (form.title !== r.title) patch.title = form.title
    if (form.description !== r.description) patch.description = form.description
    if (Number(form.categoryId) !== r.categoryId) patch.categoryId = form.categoryId
    if (!Object.keys(patch).length) return setEditing(false)
    return run(async () => {
      setFormError('')
      try {
        const updated = await api.updateRequest(r.id, patch)
        invalidateDashboard()
        setR({ ...r, ...updated, requester: r.requester, history: r.history })
        setEditing(false)
        notify('Solicitação atualizada')
      } catch (err) {
        setFormError(err.message)
      }
    })
  }

  const remove = () => {
    if (!window.confirm(`Excluir a solicitação ${fmtId(r.id)}? Esta ação não pode ser desfeita.`)) return
    return run(async () => {
      try {
        await api.deleteRequest(r.id)
        invalidateDashboard()
        notify('Solicitação excluída')
        nav('/solicitacoes')
      } catch (err) {
        notify(err.message)
      }
    })
  }

  const label = (s) => STATUS[s]?.label || s
  // A API só aceita a sequência ABERTO → EM_ATENDIMENTO → CONCLUIDO, uma etapa por chamada.
  // Escolher um status mais adiante percorre as etapas intermediárias em sequência.
  const FLOW = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO']
  const isAhead = (k) => FLOW.indexOf(k) > FLOW.indexOf(r.status)
  const selected = newStatus ?? r.status
  const dirty = selected !== r.status

  const saveStatus = () =>
    run(async () => {
      try {
        for (const step of FLOW.slice(FLOW.indexOf(r.status) + 1, FLOW.indexOf(selected) + 1)) {
          await api.updateStatus(r.id, step)
        }
        invalidateDashboard()
        setR(await api.getRequest(r.id))
        setNewStatus(null)
        notify(`Status alterado para ${label(selected)}`)
      } catch (err) {
        notify(err.message)
        // outro atendente pode ter alterado antes: recarrega o estado atual
        api.getRequest(r.id).then((d) => { setR(d); setNewStatus(null) }).catch(() => {})
      }
    })

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
          <StatusBadge status={r.status} />
          {canManage && !editing && (
            <>
              <button className="btn ghost sm" onClick={startEdit}>
                <Pencil size={14} /> Editar
              </button>
              <button className="btn danger sm" onClick={remove} disabled={busy}>
                <Trash2 size={14} /> Excluir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail">
        <div>
          <section className="card">
            <h3>Descrição</h3>
            {editing ? (
              <form className="edit-form" onSubmit={save}>
                <label className="field">
                  Assunto *
                  <input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </label>
                <label className="field">
                  Categoria *
                  <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Descrição *
                  <textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>
                {formError && <p className="error">{formError}</p>}
                <div className="row end">
                  <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
                  <button className="btn primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </form>
            ) : (
              <p>{r.description}</p>
            )}
          </section>

          <section className="card">
            <h3>Histórico</h3>
            <ol className="timeline">
              {r.history.map((h, i) => (
                <li key={i} className="event">
                  <Circle size={10} />
                  <div className="meta">
                    <b>{h.author}</b>{' '}
                    {h.from ? `alterou o status de ${label(h.from)} para ${label(h.to)}` : 'abriu a solicitação'}
                    <span className="muted"> · {fmtDate(h.at)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="comment-form">
              <textarea rows={3} disabled placeholder="Comentários em breve" />
              <button className="btn primary" disabled title="Disponível em breve">
                <MessageSquare size={14} /> Comentar
              </button>
            </div>
          </section>
        </div>

        <aside className="card side">
          <h3>{isAgent ? 'Gerenciar' : 'Detalhes'}</h3>
          <label className="field">
            Status
            <select disabled={!isAgent || busy || r.status === 'CONCLUIDO'} value={selected} onChange={(e) => setNewStatus(e.target.value)}>
              {Object.entries(STATUS).map(([k, s]) => (
                <option key={k} value={k} disabled={k !== r.status && !isAhead(k)}>{s.label}</option>
              ))}
            </select>
          </label>
          {isAgent && (
            <button className="btn primary block" onClick={saveStatus} disabled={!dirty || busy}>
              {busy ? 'Salvando...' : 'Salvar status'}
            </button>
          )}
          <label className="field">
            Prioridade
            <select disabled value="" title="Disponível em breve">
              <option value="">Não informada</option>
              {Object.entries(PRIORITY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </label>
          <label className="field">
            Responsável
            <select disabled value="" title="Disponível em breve">
              <option value="">Não atribuída</option>
            </select>
          </label>
          <hr />
          <dl>
            <dt>Solicitante</dt>
            <dd className="row"><Avatar name={r.requester || '?'} size={24} /> {r.requester}</dd>
            <dt>Criada em</dt>
            <dd>{fmtDate(r.createdAt)}</dd>
            <dt>SLA</dt>
            <dd className="row"><Clock size={14} /> {r.status === 'CONCLUIDO' ? 'Encerrada' : 'Resposta em 4h'}</dd>
          </dl>
        </aside>
      </div>
    </>
  )
}
