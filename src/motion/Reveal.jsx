import { m } from 'motion/react'
import { container, item } from './variants'

// Raiz do escalonamento: anima os filhos `Reveal`/`m.* variants={item}` ao montar.
export function Stagger({ children, ...props }) {
  return (
    <m.div variants={container} initial="hidden" animate="show" {...props}>
      {children}
    </m.div>
  )
}

// Grupo aninhado: herda o estado do `Stagger` pai e escalona os próprios filhos.
export function Group({ children, ...props }) {
  return (
    <m.div variants={container} {...props}>
      {children}
    </m.div>
  )
}

// Bloco que entra com fade + leve subida.
export function Reveal({ children, ...props }) {
  return (
    <m.div variants={item} {...props}>
      {children}
    </m.div>
  )
}
