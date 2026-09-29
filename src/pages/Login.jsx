import { useState } from 'react'
import { Mail, Lock, User, Ticket, Clock, BarChart3 } from 'lucide-react'
import { useApp } from '../context'

export default function Login() {
  const { login } = useApp()
  const [register, setRegister] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    login()
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
          <h2>{register ? 'Criar conta' : 'Bem-vindo de volta'}</h2>
          <p className="muted">{register ? 'Preencha os dados para se cadastrar.' : 'Entre com suas credenciais corporativas.'}</p>

          {register && (
            <label className="field">
              Nome completo
              <span className="input-icon">
                <User size={16} />
                <input required placeholder="Seu nome" />
              </span>
            </label>
          )}
          <label className="field">
            E-mail
            <span className="input-icon">
              <Mail size={16} />
              <input type="email" required placeholder="voce@empresa.com" />
            </span>
          </label>
          <label className="field">
            Senha
            <span className="input-icon">
              <Lock size={16} />
              <input type="password" required placeholder="••••••••" />
            </span>
          </label>

          {!register && (
            <div className="row between">
              <label className="check">
                <input type="checkbox" defaultChecked /> Lembrar-me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Esqueci a senha
              </a>
            </div>
          )}

          <button className="btn primary block">{register ? 'Cadastrar' : 'Entrar'}</button>
          <p className="muted center">
            {register ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setRegister(!register)
              }}
            >
              {register ? 'Entrar' : 'Cadastre-se'}
            </a>
          </p>
        </form>
      </section>
    </div>
  )
}
