// Padrões de animação compartilhados.
export const ease = [0.22, 1, 0.36, 1]

// Entrada escalonada de blocos (dashboard e afins)
export const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
export const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
}

// Transição entre telas. `custom` = direção:
//  back (Voltar) · forward (avançar) · up/down (clique no menu, conforme o item esteja acima/abaixo)
const OFFSET = { back: { x: -24 }, forward: { x: 24 }, up: { y: -16 }, down: { y: 16 } }
const negate = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, -v]))

export const pageVariants = {
  enter: (dir) => ({ opacity: 0, ...OFFSET[dir] }),
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.22, ease } },
  exit: (dir) => ({ opacity: 0, ...negate(OFFSET[dir]), transition: { duration: 0.14, ease } }),
}
