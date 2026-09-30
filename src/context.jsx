import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from './services/api'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(Ctx)

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('bit-user'))
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [requests, setRequests] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([api.getRequests(), api.getAgents()])
      .then(([r, a]) => {
        setRequests(r)
        setAgents(a)
      })
      .finally(() => setLoading(false))
  }, [user])

  const login = async (credentials) => {
    const u = await api.login(credentials)
    localStorage.setItem('bit-user', JSON.stringify(u))
    setUser(u)
  }
  const logout = () => {
    localStorage.removeItem('bit-user')
    setUser(null)
    setRequests([])
  }

  const replace = (updated) => setRequests((rs) => rs.map((r) => (r.id === updated.id ? updated : r)))

  const addRequest = async (data) => {
    const created = await api.createRequest(data, user)
    setRequests((rs) => [created, ...rs])
    notify(`Solicitação #${String(created.id).padStart(4, '0')} criada com sucesso`)
    return created.id
  }
  const updateRequest = async (id, patch, eventText) => replace(await api.updateRequest(id, patch, eventText, user))
  const addComment = async (id, text) => replace(await api.addComment(id, text, user))

  const isAgent = user?.role === 'atendente'

  return (
    <Ctx.Provider
      value={{ user, isAgent, requests, agents, loading, addRequest, updateRequest, addComment, toast, notify, login, logout }}
    >
      {children}
    </Ctx.Provider>
  )
}
