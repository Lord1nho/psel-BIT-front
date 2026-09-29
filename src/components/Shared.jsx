import { STATUS, PRIORITY } from '../data/mock'

export const fmtId = (id) => `#${String(id).padStart(4, '0')}`
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function StatusBadge({ status }) {
  const s = STATUS[status]
  return (
    <span className="badge" style={{ '--c': s.color }}>
      <i className="dot" />
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority]
  return (
    <span className="badge flat" style={{ '--c': p.color }}>
      {p.label}
    </span>
  )
}

export function Avatar({ name, size = 32 }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} title={name}>
      {initials}
    </span>
  )
}
