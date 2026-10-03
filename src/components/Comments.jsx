import { useEffect, useRef, useState } from 'react'
import { Ban, MessageSquare, Pencil, Trash2, Info } from 'lucide-react'
import { useApp } from '../context'
import { useComments } from '../hooks/useComments'
import { useAction } from '../hooks/useAction'
import { fmtDate, Avatar } from './Shared'
import Modal from './Modal'
import { COMMENT_MAX, cleanText, validateComment } from '../utils/requestValidation'

// Conversa do chamado. As regras de permissão são do servidor; aqui só decidimos o que mostrar.
// `onRequestChanged` recarrega o detalhe (comentar como atendente num chamado ABERTO assume o chamado).
export default function Comments({ request: r, onRequestChanged }) {
  const { user, isAgent, showError } = useApp()
  const closed = r.status === 'CONCLUIDO'
  const { comments, loading, error, reload, add, edit, remove } = useComments(r.id, { live: !closed })
  const [run, busy] = useAction()
  const [text, setText] = useState('')
  const [touched, setTouched] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [deleting, setDeleting] = useState(null)
  const listRef = useRef(null)
  const stickRef = useRef(true)

  // só rola para o fim quando o usuário já estava no fim (não atrapalha quem está lendo o começo)
  useEffect(() => {
    const el = listRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [comments.length])
  const onScroll = (e) => {
    const el = e.currentTarget
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  const blockedBy =
    isAgent && r.status === 'EM_ATENDIMENTO' && r.assigneeId && r.assigneeId !== user.id
      ? `Somente ${r.assignee} pode comentar neste chamado`
      : ''
  const willAssume = isAgent && r.status === 'ABERTO'
  const fieldError = touched ? validateComment(text) : ''

  const failed = (title, err) => {
    showError(title, err.message)
    // 403/409: outro atendente assumiu ou o chamado foi concluído — atualiza o estado atual
    if (err.status === 403 || err.status === 409) {
      onRequestChanged?.()
      reload()
    }
  }

  const send = (e) => {
    e.preventDefault()
    setTouched(true)
    if (validateComment(text)) return
    return run(async () => {
      try {
        await add(text.trim())
        setText('')
        setTouched(false)
        stickRef.current = true
        if (willAssume) await onRequestChanged?.()
      } catch (err) {
        failed('Não foi possível enviar o comentário', err)
      }
    })
  }

  const saveEdit = (c) => {
    if (validateComment(editText)) return
    if (editText.trim() === c.text) return setEditingId(null)
    return run(async () => {
      try {
        await edit(c.id, editText.trim())
        setEditingId(null)
      } catch (err) {
        failed('Não foi possível editar o comentário', err)
      }
    })
  }

  const confirmDelete = () => {
    const c = deleting
    setDeleting(null)
    return run(async () => {
      try {
        await remove(c.id)
      } catch (err) {
        failed('Não foi possível excluir o comentário', err)
      }
    })
  }

  const near = text.length >= COMMENT_MAX * 0.9 ? 'counter warn' : 'counter'

  return (
    <div className="comments">
      {loading && <p className="muted">Carregando comentários...</p>}
      {error && <p className="error">{error.message}</p>}
      {!loading && !error && comments.length === 0 && <p className="muted">Nenhum comentário ainda.</p>}

      {comments.length > 0 && (
        <ul className="comment-list" ref={listRef} onScroll={onScroll}>
          {comments.map((c) => {
            const mine = c.author.id === user.id
            return (
              <li key={c.id} className={mine ? 'comment mine' : 'comment'}>
                <Avatar name={c.author.name || '?'} size={28} />
                <div className="bubble">
                  <div className="comment-meta">
                    <b>{c.author.name}</b>
                    {c.author.role === 'ATENDENTE' && <span className="role-tag">Atendente</span>}
                    <span className="muted">{fmtDate(c.createdAt)}</span>
                    {c.editedAt && <span className="muted comment-edited" title={fmtDate(c.editedAt)}>editado</span>}
                  </div>
                  {editingId === c.id ? (
                    <div className="comment-edit">
                      <textarea
                        rows={3}
                        autoFocus
                        maxLength={COMMENT_MAX}
                        value={editText}
                        onChange={(e) => setEditText(cleanText(e.target.value))}
                        aria-label="Editar comentário"
                      />
                      <div className="row end">
                        <button type="button" className="btn ghost sm" onClick={() => setEditingId(null)}>Cancelar</button>
                        <button type="button" className="btn primary sm" disabled={busy || !!validateComment(editText)} onClick={() => saveEdit(c)}>
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{c.text}</p>
                  )}
                  {mine && !closed && editingId !== c.id && (
                    <div className="comment-actions">
                      <button type="button" className="btn ghost sm" disabled={busy} onClick={() => { setEditingId(c.id); setEditText(c.text) }}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button type="button" className="btn ghost sm" disabled={busy} onClick={() => setDeleting(c)}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {closed ? (
        <p className="comment-note"><Info size={14} /> Chamado concluído: a conversa é somente leitura.</p>
      ) : (
        <form className="comment-form" onSubmit={send} noValidate>
          {willAssume && <p className="comment-note"><Info size={14} /> Ao comentar, você assume este chamado.</p>}
          <div className={blockedBy ? 'tip-wrap blocked block' : 'tip-wrap block'} tabIndex={blockedBy ? 0 : undefined}>
            <textarea
              rows={3}
              maxLength={COMMENT_MAX}
              placeholder="Escreva uma mensagem"
              aria-label="Novo comentário"
              disabled={!!blockedBy || busy}
              value={text}
              onChange={(e) => setText(cleanText(e.target.value))}
              onBlur={() => text && setTouched(true)}
              aria-invalid={!!fieldError}
              className={fieldError ? 'invalid' : ''}
            />
            {blockedBy && <span role="tooltip" className="tip"><Ban size={14} /> {blockedBy}</span>}
          </div>
          <div className="field-foot">
            <span className="field-error">{fieldError}</span>
            <span className={near}>{text.length}/{COMMENT_MAX}</span>
          </div>
          <button className="btn primary" disabled={busy || !!blockedBy || !text.trim()}>
            <MessageSquare size={14} /> {busy ? 'Enviando...' : 'Comentar'}
          </button>
        </form>
      )}

      <Modal
        open={!!deleting}
        variant="danger"
        title="Excluir este comentário?"
        cancelLabel="Manter comentário"
        confirmLabel="Excluir"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      >
        A exclusão é definitiva e não pode ser desfeita.
      </Modal>
    </div>
  )
}
