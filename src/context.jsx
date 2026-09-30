import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from './services/api'
import { session, setUnauthorizedHandler } from './services/http'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => session.get()?.user || null)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // 401 fora do login: token ausente/expirado -> volta para a tela de login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      notify('Sessão expirada. Entre novamente.')
    })
  }, [notify])

  const login = async (credentials) => setUser(await api.login(credentials))
  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  const isAgent = user?.role === 'ATENDENTE'

  return <Ctx.Provider value={{ user, isAgent, toast, notify, login, logout }}>{children}</Ctx.Provider>
}
