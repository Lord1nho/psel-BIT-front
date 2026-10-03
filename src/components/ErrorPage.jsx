import { Link, useRouteError } from 'react-router-dom'
import { ShieldAlert, SearchX, TriangleAlert, Lock } from 'lucide-react'

const CONTENT = {
  unauthorized: {
    icon: Lock,
    code: '401',
    title: 'Sessão expirada',
    message: 'Para continuar, entre novamente com seu usuário e senha. Você será levado à tela de solicitações.',
  },
  forbidden: {
    icon: ShieldAlert,
    code: '403',
    title: 'Acesso negado',
    message: 'Você não tem permissão para ver este conteúdo.',
  },
  notfound: {
    icon: SearchX,
    code: '404',
    title: 'Página não encontrada',
    message: 'O endereço acessado não existe ou o conteúdo foi removido.',
  },
  generic: {
    icon: TriangleAlert,
    code: 'Erro',
    title: 'Algo deu errado',
    message: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  },
}

// Tela de erro padrão. `fullscreen` ocupa a tela toda (fora do layout); sem ele aparece dentro do conteúdo.
// `onAction` define a ação principal (ex.: ir ao login); por padrão leva à listagem de solicitações.
export default function ErrorPage({ variant = 'generic', title, message, fullscreen = false, onAction, actionLabel }) {
  const routeError = useRouteError() // só existe quando renderizada como errorElement do router
  const c = CONTENT[variant]
  const Icon = c.icon
  const detail = import.meta.env.DEV && routeError ? String(routeError.message || routeError) : null

  return (
    <div className={fullscreen ? 'error-page fullscreen' : 'error-page'}>
      <div className="error-icon"><Icon size={34} /></div>
      <span className="error-code">{c.code}</span>
      <h1>{title || c.title}</h1>
      <p className="muted">{message || c.message}</p>
      {detail && <pre className="error-detail">{detail}</pre>}
      <div className="row">
        {onAction ? (
          <button className="btn primary" onClick={onAction}>{actionLabel || 'Fazer login'}</button>
        ) : (
          <Link to="/solicitacoes" className="btn primary">{actionLabel || 'Ir para as solicitações'}</Link>
        )}
        {variant === 'generic' && (
          <button className="btn ghost" onClick={() => window.location.reload()}>Tentar novamente</button>
        )}
      </div>
    </div>
  )
}
