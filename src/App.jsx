import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './context'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'

// Raiz: aviso (toast) global, visível também na tela de login
function Shell() {
  const { toast } = useApp()
  return (
    <>
      <Outlet />
      <AnimatePresence>
        {toast && (
          <m.div
            key="toast"
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 size={18} /> {toast}
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Apenas usuários autenticados acessam o sistema; sem login, qualquer rota mostra o login
function Protected() {
  const { user } = useApp()
  return user ? <Outlet /> : <Login />
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
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
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
