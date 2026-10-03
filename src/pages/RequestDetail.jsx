import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Circle, Clock, Pencil, Trash2, Ban } from 'lucide-react'
import { useApp } from '../context'
import { STATUS, PRIORITY } from '../data/mock'
import * as api from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { invalidateDashboard } from '../queryClient'
import { useAction } from '../hooks/useAction'
import { fmtId, fmtDate, StatusBadge, Avatar } from '../components/Shared'
import Modal from '../components/Modal'
import Comments from '../components/Comments'
import ErrorPage from '../components/ErrorPage'
import RequestFields from '../components/RequestFields'
import { cleanLine, cleanText, validateRequest } from '../utils/requestValidation'

export default function RequestDetail() {
  const { id } = useParams()
  const { user, isAgent, notify, showError } = useApp()
  const nav = useNavigate()
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const { categories } = useCategories({ enabled: editing }) // só busca ao editar; depois vem do cache
  const [form, setForm] = useState({})
  const [touchedEdit, setTouchedEdit] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  // recarrega o detalhe (ex.: depois que um comentário assume o chamado) e o dashboard
  const reload = async () => {
    try {
      setR(await api.getRequest(id))
      invalidateDashboard()
    } catch {
      // mantém o que já está na tela
    }
  }

  if (error)
    return error.status === 404 ? (
      <ErrorPage variant="notfound" title="Solicitação não encontrada" message={error.message} />
    ) : error.status === 403 ? (
      <ErrorPage variant="forbidden" title="Sem acesso a esta solicitação" message={error.message} />
    ) : (
      <ErrorPage variant="generic" title="Não foi possível carregar a solicitação" message={error.message} />
    )
  if (!r) return <p className="muted">Carregando...</p>

  // o servidor valida de qualquer forma; aqui só decidimos o que mostrar
  // Quem pode mexer no status: só atendente; e, depois que alguém assumiu, só o responsável (o servidor responde 403 aos demais)
  const statusBlock = !isAgent
    ? 'Apenas atendentes podem alterar o status'
    : r.status === 'EM_ATENDIMENTO' && r.assigneeId && r.assigneeId !== user.id
      ? `Somente ${r.assignee} pode alterar o status deste chamado`
      : ''
  const canManage = !isAgent && r.status === 'ABERTO' && r.requesterId === user.id

  const startEdit = async () => {
    setForm({ title: r.title, description: r.description, categoryId: r.categoryId })
    setTouchedEdit({})
    setEditing(true)
  }

  // Mesmas regras da criação (veja utils/requestValidation.js); o erro aparece depois que o campo é visitado
  const editErrors = editing ? validateRequest(form) : {}
  const editValid = Object.keys(editErrors).length === 0
  const shownEditErrors = Object.fromEntries(Object.entries(editErrors).filter(([k]) => touchedEdit[k]))
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: field === 'title' ? cleanLine(value) : field === 'description' ? cleanText(value) : value }))

  const save = async (e) => {
    e.preventDefault()
    if (!editValid) return setTouchedEdit({ title: true, categoryId: true, description: true })
    const title = form.title.trim()
    const description = form.description.trim()
    const patch = {}
    if (title !== r.title) patch.title = title
    if (description !== r.description) patch.description = description
    if (Number(form.categoryId) !== r.categoryId) patch.categoryId = form.categoryId
    if (!Object.keys(patch).length) return setEditing(false)
    return run(async () => {
      try {
        const updated = await api.updateRequest(r.id, patch)
        invalidateDashboard()
        setR({ ...r, ...updated, requester: r.requester, assignee: r.assignee, assigneeId: r.assigneeId, history: r.history })
        setEditing(false)
        notify('Solicitação atualizada')
      } catch (err) {
        showError('Não foi possível salvar as alterações', err.message)
      }
    })
  }

  // a exclusão pede confirmação em modal (vermelho); só chama a API depois de confirmar
  const remove = () => {
    setConfirmDelete(false)
    return run(async () => {
      try {
        await api.deleteRequest(r.id)
        invalidateDashboard()
        notify('Solicitação excluída')
        nav('/solicitacoes')
      } catch (err) {
        showError('Não foi possível excluir a solicitação', err.message)
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
        showError('Não foi possível alterar o status', err.message)
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
              <button className="btn danger sm" onClick={() => setConfirmDelete(true)} disabled={busy}>
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
              <form className="edit-form" onSubmit={save} noValidate>
                <RequestFields
                  idPrefix="edit"
                  values={form}
                  categories={categories}
                  errors={shownEditErrors}
                  onChange={setField}
                  onBlur={(k) => setTouchedEdit((t) => ({ ...t, [k]: true }))}
                />
                <div className="row end">
                  <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
                  <button className="btn primary" disabled={busy || !editValid}>{busy ? 'Salvando...' : 'Salvar'}</button>
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
          </section>

          <section className="card">
            <h3>Comentários</h3>
            <Comments request={r} onRequestChanged={reload} />
          </section>
        </div>

        <aside className="card side">
          <h3>{isAgent ? 'Gerenciar' : 'Detalhes'}</h3>
          <div className="field">
            <label htmlFor="req-status">Status</label>
            {/* Para quem não é atendente: cursor de "não permitido" e um aviso ao passar o mouse (ou focar) */}
            <div
              className={statusBlock ? 'tip-wrap blocked' : 'tip-wrap'}
              tabIndex={statusBlock ? 0 : undefined}
              aria-describedby={statusBlock ? 'status-tip' : undefined}
            >
              <select
                id="req-status"
                disabled={!!statusBlock || busy || r.status === 'CONCLUIDO'}
                value={selected}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(STATUS).map(([k, s]) => (
                  <option key={k} value={k} disabled={k !== r.status && !isAhead(k)}>{s.label}</option>
                ))}
              </select>
              {statusBlock && (
                <span id="status-tip" role="tooltip" className="tip">
                  <Ban size={14} /> {statusBlock}
                </span>
              )}
            </div>
          </div>
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
          <div className="field">
            Responsável
            {r.assignee ? (
              <span className="field-value row"><Avatar name={r.assignee} size={24} /> {r.assignee}</span>
            ) : (
              <span className="field-value muted">Sem atendente</span>
            )}
          </div>
          <hr />
          <dl>
            <dt>Setor</dt>
            <dd>{r.category}</dd>
            <dt>Solicitante</dt>
            <dd className="row"><Avatar name={r.requester || '?'} size={24} /> {r.requester}</dd>
            <dt>Criada em</dt>
            <dd>{fmtDate(r.createdAt)}</dd>
            <dt>SLA</dt>
            <dd className="row"><Clock size={14} /> {r.status === 'CONCLUIDO' ? 'Encerrada' : 'Resposta em 4h'}</dd>
          </dl>
        </aside>
      </div>
      <Modal
        open={confirmDelete}
        variant="danger"
        title="Excluir esta solicitação?"
        cancelLabel="Manter solicitação"
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      >
        A solicitação {fmtId(r.id)} e seu histórico serão removidos. Esta ação não pode ser desfeita.
      </Modal>
    </>
  )
}
