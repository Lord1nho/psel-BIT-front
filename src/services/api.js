// Camada de acesso a dados. Hoje responde com dados mockados em memória;
// para integrar a API real, basta trocar o corpo de cada função por um fetch/axios
// mantendo a mesma assinatura e o mesmo formato de retorno.
import { INITIAL_REQUESTS, MOCK_USERS, AGENTS } from '../data/mock'

// const BASE_URL = import.meta.env.VITE_API_URL
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

let db = structuredClone(INITIAL_REQUESTS)

/** POST /auth/login -> { name, email, role: 'solicitante' | 'atendente' } */
export async function login({ email }) {
  await delay()
  const user = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase())
  if (!user) throw new Error('Usuário não encontrado')
  return user
}

/** GET /requests -> Request[] */
export async function getRequests() {
  await delay()
  return structuredClone(db)
}

/** GET /agents -> string[] (atendentes disponíveis para atribuição) */
export async function getAgents() {
  await delay(100)
  return AGENTS
}

/** POST /requests -> Request */
export async function createRequest(data, user) {
  await delay()
  const now = new Date().toISOString()
  const req = {
    ...data,
    id: Math.max(0, ...db.map((r) => r.id)) + 1,
    status: 'aberta',
    assignee: null,
    requester: user.name,
    createdAt: now,
    history: [{ type: 'event', author: user.name, text: 'abriu a solicitação', at: now }],
  }
  db = [req, ...db]
  return structuredClone(req)
}

/** PATCH /requests/:id -> Request */
export async function updateRequest(id, patch, eventText, user) {
  await delay(150)
  db = db.map((r) =>
    r.id === id
      ? {
          ...r,
          ...patch,
          history: eventText
            ? [...r.history, { type: 'event', author: user.name, text: eventText, at: new Date().toISOString() }]
            : r.history,
        }
      : r,
  )
  return structuredClone(db.find((r) => r.id === id))
}

/** POST /requests/:id/comments -> Request */
export async function addComment(id, text, user) {
  await delay(150)
  db = db.map((r) =>
    r.id === id
      ? { ...r, history: [...r.history, { type: 'comment', author: user.name, text, at: new Date().toISOString() }] }
      : r,
  )
  return structuredClone(db.find((r) => r.id === id))
}
