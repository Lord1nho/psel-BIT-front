import { CheckCircle2, XCircle } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppProvider, useApp } from './context'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'
import Modal from './components/Modal'
import ErrorPage from './components/ErrorPage'

// Raiz: aviso (toast) global, visível também na tela de login
function Shell() {
  const { toast, failure, clearError } = useApp()
  return (
    <>
      <Outlet />
      {/* falhas de ação (criar, editar, excluir, status) aparecem neste modal de erro */}
      <Modal open={!!failure} variant="error" title={failure?.title} onConfirm={clearError} onCancel={clearError}>
        {failure?.message}
      </Modal>
      <AnimatePresence>
        {toast && (
          <m.div
            key="toast"
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />} {toast.msg}
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Apenas usuários autenticados acessam o sistema; sem login, qualquer rota mostra o login
// Logo após o login o destino é sempre a listagem (nunca /nova nem um chamado). Enquanto isso, nenhuma tela
// protegida é montada: evita buscar dados (ex.: dashboard) de uma tela que seria trocada em seguida.
function PostLoginRedirect() {
  const { pathname } = useLocation()
  const { clearLoginRedirect } = useApp()
  useEffect(() => {
    if (pathname === '/solicitacoes') clearLoginRedirect()
  }, [pathname, clearLoginRedirect])
  return pathname === '/solicitacoes' ? null : <Navigate to="/solicitacoes" replace />
}

function Protected() {
  const { user, authError, dismissAuthError, loginRedirect } = useApp()
  if (user && loginRedirect) return <PostLoginRedirect />
  if (user) return <Outlet />
  // sessão expirada (401): tela de erro pedindo novo login; depois do login o destino é sempre a listagem
  if (authError) return <ErrorPage variant="unauthorized" fullscreen onAction={dismissAuthError} actionLabel="Fazer login" />
  return <Login />
}

// O atendente não abre solicitações
function RequesterOnly({ children }) {
  const { isAgent } = useApp()
  return isAgent ? <Navigate to="/" replace /> : children
}

// Router de dados (necessário para useBlocker, usado na confirmação de saída da nova solicitação)
const router = createBrowserRouter([
  {
    element: <Shell />,
    errorElement: <ErrorPage variant="generic" fullscreen />,
    children: [
      {
        element: <Protected />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'solicitacoes', element: <Requests /> },
              { path: 'solicitacoes/:id', element: <RequestDetail /> },
              { path: 'nova', element: <RequesterOnly><NewRequest /></RequesterOnly> },
              { path: '*', element: <ErrorPage variant="notfound" /> },
            ],
          },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}
