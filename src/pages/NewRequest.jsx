import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import * as api from '../services/api'
import { invalidateDashboard } from '../queryClient'

export default function NewRequest() {
  const { notify } = useApp()
  const nav = useNavigate()
  const [categories, setCategories] = useState([])
  const [f, setF] = useState({ title: '', categoryId: '', description: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    api
      .getCategories()
      .then((c) => {
        setCategories(c)
        setF((prev) => ({ ...prev, categoryId: c[0]?.id ?? '' }))
      })
      .catch((e) => setError(e.message))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api.createRequest(f)
      invalidateDashboard()
      notify(`Solicitação #${String(created.id).padStart(4, '0')} criada com sucesso`)
      nav(`/solicitacoes/${created.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Nova solicitação</h1>
          <p className="muted">Descreva sua demanda para que possamos ajudar mais rápido</p>
        </div>
      </div>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          Assunto *
          <input required maxLength={255} placeholder="Resuma o problema em uma frase" value={f.title} onChange={set('title')} />
        </label>
        <label className="field">
          Categoria *
          <select required value={f.categoryId} onChange={set('categoryId')}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Descrição *
          <textarea required rows={6} placeholder="Inclua detalhes, passos para reproduzir e impacto no trabalho" value={f.description} onChange={set('description')} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
          <button className="btn primary" disabled={busy || !f.categoryId}>{busy ? 'Enviando...' : 'Enviar solicitação'}</button>
        </div>
      </form>
    </>
  )
}
