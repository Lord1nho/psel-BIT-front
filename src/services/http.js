const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const SESSION_KEY = 'bit-session'

export const session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  },
  set(value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  },
  clear() {
    localStorage.removeItem(SESSION_KEY)
  },
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

// `message` vem como array nos erros de validação e como string nos demais.
const parseMessage = (body, fallback) => {
  const m = body?.message
  if (Array.isArray(m)) return m.join('; ')
  return m || fallback
}

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  })
  const qs = params.toString()

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = session.get()?.accessToken
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor')
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && auth) {
      session.clear()
      onUnauthorized()
    }
    throw new ApiError(res.status, parseMessage(data, `Erro ${res.status}`))
  }
  return data
}
