import { useState } from 'react'
import { User, Lock, Ticket, Clock, BarChart3 } from 'lucide-react'
import { useApp } from '../context'
import { useAction } from '../hooks/useAction'

export default function Login() {
  const { login } = useApp()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [run, busy] = useAction()

  const submit = (e) => {
    e.preventDefault()
    return run(async () => {
      setError('')
      try {
        await login({ usuario, senha }) // o redirecionamento para a listagem é feito em Protected (App.jsx)
      } catch (err) {
        setError(err.message)
      }
    })
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand big">
          <span className="logo">BIT</span>
          <span>Tecnologia e Energias Renováveis</span>
        </div>
        <h1>Portal de Solicitações Internas</h1>
        <p>Registre demandas, acompanhe cada etapa e receba a solução sem sair da plataforma.</p>
        <ul>
          <li>
            <Ticket size={18} /> Abra solicitações em poucos cliques
          </li>
          <li>
            <Clock size={18} /> Acompanhe prazos e andamento
          </li>
          <li>
            <BarChart3 size={18} /> Visão geral em um dashboard
          </li>
        </ul>
      </section>

      <section className="auth-form">
        <form onSubmit={submit} className="card auth-card">
          <h2>Bem-vindo de volta</h2>
          <p className="muted">Entre com suas credenciais corporativas.</p>

          <label className="field">
            Usuário
            <span className="input-icon">
              <User size={16} />
              <input required autoComplete="username" placeholder="seu.usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </span>
          </label>
          <label className="field">
            Senha
            <span className="input-icon">
              <Lock size={16} />
              <input type="password" required autoComplete="current-password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </span>
          </label>

          {error && <p className="error">{error}</p>}
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
