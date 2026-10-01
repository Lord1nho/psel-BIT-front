import { useCallback, useRef, useState } from 'react'

// Executa uma ação assíncrona (chamada à API) uma vez por vez.
// O ref bloqueia cliques repetidos no mesmo instante, antes de o estado `busy`
// chegar a renderizar o botão desabilitado.
export function useAction() {
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async (fn) => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    try {
      return await fn()
    } finally {
      locked.current = false
      setBusy(false)
    }
  }, [])

  return [run, busy]
}
