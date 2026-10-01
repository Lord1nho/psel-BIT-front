import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'

function Routing() {
  const { user, isAgent, toast } = useApp()
  const toastEl = (
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
  )
  if (!user)
    return (
      <>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
        {toastEl}
      </>
    )
  return (
    <>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="solicitacoes" element={<Requests />} />
        <Route path="solicitacoes/:id" element={<RequestDetail />} />
        {!isAgent && <Route path="nova" element={<NewRequest />} />}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {toastEl}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routing />
      </AppProvider>
    </BrowserRouter>
  )
}
