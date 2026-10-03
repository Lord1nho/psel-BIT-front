import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import * as api from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { invalidateDashboard } from '../queryClient'
import { useAction } from '../hooks/useAction'
import Modal from '../components/Modal'
import RequestFields from '../components/RequestFields'
import { cleanLine, cleanText, validateRequest } from '../utils/requestValidation'

export default function NewRequest() {
  const { notify, showError } = useApp()
  const nav = useNavigate()
  const { categories, error } = useCategories()
  const [f, setF] = useState({ title: '', categoryId: '', description: '' })
  const [run, busy] = useAction()
  // campos de texto passam por limpeza (caracteres de controle) a cada alteração
  const set = (field, value) => setF((prev) => ({ ...prev, [field]: field === 'title' ? cleanLine(value) : field === 'description' ? cleanText(value) : value }))

  // categoria padrão = a primeira da lista, enquanto o usuário não escolher outra (sem efeito/estado extra)
  const categoryId = f.categoryId || (categories[0]?.id ?? '')
  const values = { ...f, categoryId }

  // Validação no front (espelha as regras da API; veja utils/requestValidation.js)
  const [touched, setTouched] = useState({})
  const errors = validateRequest(values)
  const valid = Object.keys(errors).length === 0
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }))
  // o erro só aparece depois que o campo é visitado
  const shown = Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k]))

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
        const created = await api.createRequest({ categoryId, title: f.title.trim(), description: f.description.trim() })
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
        <RequestFields idPrefix="req" values={values} categories={categories} errors={shown} onChange={set} onBlur={touch} />
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
