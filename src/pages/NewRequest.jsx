import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import { CATEGORIES, PRIORITY } from '../data/mock'

export default function NewRequest() {
  const { addRequest } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ title: '', category: CATEGORIES[0], priority: 'media', description: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const id = await addRequest(f)
    nav(`/solicitacoes/${id}`)
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
          <input required maxLength={100} placeholder="Resuma o problema em uma frase" value={f.title} onChange={set('title')} />
        </label>
        <div className="grid two tight">
          <label className="field">
            Categoria
            <select value={f.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Prioridade
            <select value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITY).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Descrição *
          <textarea required rows={6} placeholder="Inclua detalhes, passos para reproduzir e impacto no trabalho" value={f.description} onChange={set('description')} />
        </label>
        <div className="row end">
          <button type="button" className="btn ghost" onClick={() => nav(-1)}>Cancelar</button>
          <button className="btn primary">Enviar solicitação</button>
        </div>
      </form>
    </>
  )
}
