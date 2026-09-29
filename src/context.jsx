import { createContext, useContext, useState, useCallback } from 'react'
import { INITIAL_REQUESTS, CURRENT_USER } from './data/mock'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [toast, setToast] = useState(null)
  const [authed, setAuthed] = useState(() => localStorage.getItem('bit-auth') === '1')

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const login = () => {
    localStorage.setItem('bit-auth', '1')
    setAuthed(true)
  }
  const logout = () => {
    localStorage.removeItem('bit-auth')
    setAuthed(false)
  }

  const addRequest = (data) => {
    const now = new Date().toISOString()
    const id = Math.max(...requests.map((r) => r.id)) + 1
    setRequests((rs) => [
      {
        ...data,
        id,
        status: 'aberta',
        assignee: null,
        requester: CURRENT_USER,
        createdAt: now,
        history: [{ type: 'event', author: CURRENT_USER, text: 'abriu a solicitação', at: now }],
      },
      ...rs,
    ])
    notify(`Solicitação #${String(id).padStart(4, '0')} criada com sucesso`)
    return id
  }

  const updateRequest = (id, patch, eventText) =>
    setRequests((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              history: eventText
                ? [...r.history, { type: 'event', author: CURRENT_USER, text: eventText, at: new Date().toISOString() }]
                : r.history,
            }
          : r,
      ),
    )

  const addComment = (id, text) =>
    setRequests((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, history: [...r.history, { type: 'comment', author: CURRENT_USER, text, at: new Date().toISOString() }] }
          : r,
      ),
    )

  return (
    <Ctx.Provider value={{ requests, addRequest, updateRequest, addComment, toast, notify, authed, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}
