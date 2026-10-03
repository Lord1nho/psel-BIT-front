import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from './services/api'
import { session, setUnauthorizedHandler } from './services/http'
import { queryClient } from './queryClient'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => session.get()?.user || null)
  const [toast, setToast] = useState(null) // { msg, type }
  const [failure, setFailure] = useState(null) // { title, message } -> modal de erro global
  const [authError, setAuthError] = useState(false) // sessão expirada/não autenticado -> tela de erro 401

  // Toast de sucesso (verde) por padrão; falhas de ação usam showError (modal)
  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  const showError = useCallback((title, message) => setFailure({ title, message }), [])
  const clearError = useCallback(() => setFailure(null), [])

  // 401 fora do login: token ausente/expirado -> volta para a tela de login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear()
      setUser(null)
      setAuthError(true)
    })
  }, [])

  const login = async (credentials) => {
    setUser(await api.login(credentials))
    setAuthError(false)
  }
  const logout = async () => {
    await api.logout()
    queryClient.clear()
    setUser(null)
  }

  const isAgent = user?.role === 'ATENDENTE'

  return (
    <Ctx.Provider
      value={{ user, isAgent, toast, notify, failure, showError, clearError, authError, dismissAuthError: () => setAuthError(false), login, logout }}
    >
      {children}
    </Ctx.Provider>
  )
}
