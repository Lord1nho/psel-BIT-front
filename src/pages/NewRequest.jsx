import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import * as api from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { invalidateDashboard } from '../queryClient'
import { useAction } from '../hooks/useAction'
import Modal from '../components/Modal'

export default function NewRequest() {
  const { notify, showError } = useApp()
  const nav = useNavigate()
  const { categories, error } = useCategories()
  const [f, setF] = useState({ title: '', categoryId: '', description: '' })
  const [run, busy] = useAction()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  // categoria padrão = a primeira da lista, enquanto o usuário não escolher outra (sem efeito/estado extra)
  const categoryId = f.categoryId || (categories[0]?.id ?? '')

  // Validação no front (espelha as regras da API: textos não vazios e assunto até 255 caracteres)
  const [touched, setTouched] = useState({})
  const errors = {
    title: f.title.trim() ? '' : 'Informe o assunto da solicitação.',
    categoryId: categoryId ? '' : 'Selecione uma categoria.',
    description: f.description.trim() ? '' : 'Descreva a solicitação.',
  }
  const valid = !errors.title && !errors.categoryId && !errors.description
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }))
  const shown = (k) => (touched[k] ? errors[k] : '') // o erro só aparece depois que o campo é visitado

  // Há progresso a perder quando título ou descrição foram preenchidos
  const dirty = f.title.trim() !== '' || f.description.trim() !== ''
  const allowLeave = useRef(false) // liberado após criar a solicitação com sucesso

  // Bloqueia qualquer saída da tela (menu, logo, Cancelar, botão do navegador) e pede confirmação
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname,
  )

  // Recarregar ou fechar a aba: o navegador mostra o próprio aviso
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return setTouched({ title: true, categoryId: true, description: true })
    return run(async () => {
      try {
        const created = await api.createRequest({ ...f, categoryId, title: f.title.trim(), description: f.description.trim() })
        invalidateDashboard()
        allowLeave.current = true
        notify(`Solicitação #${String(created.id).padStart(4, '0')} criada com sucesso`)
        nav(`/solicitacoes/${created.id}`)
      } catch (err) {
        showError('Não foi possível criar a solicitação', err.message)
      }
    })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Nova solicitação</h1>
          <p className="muted">Descreva sua demanda para que possamos ajudar mais rápido</p>
        </div>
      </div>

      {/* noValidate: as mensagens são as do sistema (abaixo de cada campo), não os balões do navegador */}
      <form className="card form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="req-title">Assunto *</label>
          <input
            id="req-title"
            required
            maxLength={255}
            placeholder="Resuma o problema em uma frase"
            value={f.title}
            onChange={set('title')}
            onBlur={touch('title')}
            aria-invalid={!!shown('title')}
            aria-describedby="req-title-msg"
            className={shown('title') ? 'invalid' : ''}
          />
          <div className="field-foot" id="req-title-msg">
            <span className="field-error">{shown('title')}</span>
            <span className={f.title.length >= 230 ? 'counter warn' : 'counter'}>{f.title.length}/255</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="req-category">Categoria *</label>
          <select
            id="req-category"
            required
            value={categoryId}
            onChange={set('categoryId')}
            onBlur={touch('categoryId')}
            aria-invalid={!!shown('categoryId')}
            className={shown('categoryId') ? 'invalid' : ''}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {shown('categoryId') && <span className="field-error">{shown('categoryId')}</span>}
        </div>
        <div className="field">
          <label htmlFor="req-description">Descrição *</label>
          <textarea
            id="req-description"
            required
            rows={6}
            placeholder="Inclua detalhes, passos para reproduzir e impacto no trabalho"
            value={f.description}
            onChange={set('description')}
            onBlur={touch('description')}
            aria-invalid={!!shown('description')}
            className={shown('description') ? 'invalid' : ''}
          />
          {shown('description') && <span className="field-error">{shown('description')}</span>}
        </div>
        {error && <p className="error">{error.message}</p>}
        <div className="row end">
          {!valid && !busy && <span className="muted form-hint">Preencha os campos obrigatórios para enviar.</span>}
          <button type="button" className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
          <button className="btn primary" disabled={busy || !valid}>{busy ? 'Enviando...' : 'Enviar solicitação'}</button>
        </div>
      </form>
      <Modal
        open={blocker.state === 'blocked'}
        variant="warning"
        title="Sair sem enviar a solicitação?"
        cancelLabel="Continuar editando"
        confirmLabel="Sair e descartar"
        onCancel={() => blocker.reset()}
        onConfirm={() => blocker.proceed()}
      >
        Você ainda não enviou esta solicitação. Se sair agora, o que foi preenchido será perdido.
      </Modal>
    </>
  )
}
