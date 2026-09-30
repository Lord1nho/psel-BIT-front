import { useState } from 'react'
import { Mail, Lock, Ticket, Clock, BarChart3 } from 'lucide-react'
import { useApp } from '../context'

export default function Login() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login({ email })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
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
            E-mail
            <span className="input-icon">
              <Mail size={16} />
              <input type="email" required placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </span>
          </label>
          <label className="field">
            Senha
            <span className="input-icon">
              <Lock size={16} />
              <input type="password" required placeholder="••••••••" />
            </span>
          </label>

          {error && <p className="error">{error}</p>}
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="muted center demo">
            Protótipo — use <a href="#" onClick={(e) => { e.preventDefault(); setEmail('solicitante@bit.com') }}>solicitante@bit.com</a> ou{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setEmail('atendente@bit.com') }}>atendente@bit.com</a> (qualquer senha)
          </p>
        </form>
      </section>
    </div>
  )
}
