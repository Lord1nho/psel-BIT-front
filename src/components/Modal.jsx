import { useEffect } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Info, AlertTriangle, Trash2, CheckCircle2, XCircle } from 'lucide-react'

// Cores e ícones padronizados por contexto/ação.
//  info (azul): criação/edição · warning (âmbar): sair/descartar · danger (vermelho): exclusão
//  success (verde): conclusão · error (vermelho): falha
const VARIANTS = {
  info: { icon: Info },
  warning: { icon: AlertTriangle },
  danger: { icon: Trash2 },
  success: { icon: CheckCircle2 },
  error: { icon: XCircle },
}

// Modal. Com `cancelLabel` mostra dois botões (cancelar seguro em destaque + confirmar na cor da variante);
// sem `cancelLabel` mostra só o botão de confirmação. Esc e clique no fundo chamam `onCancel`.
export default function Modal({ open, variant = 'info', title, children, confirmLabel = 'Entendi', cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const Icon = VARIANTS[variant].icon

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
        >
          <m.div
            className={`modal ${variant}`}
            role={variant === 'error' || variant === 'danger' || variant === 'warning' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon"><Icon size={22} /></div>
            <h3 id="modal-title">{title}</h3>
            <p className="muted">{children}</p>
            <div className="row end">
              {cancelLabel ? (
                <>
                  <button type="button" className="btn primary" autoFocus onClick={onCancel}>{cancelLabel}</button>
                  <button type="button" className="btn tone" onClick={onConfirm}>{confirmLabel}</button>
                </>
              ) : (
                <button type="button" className="btn tone" autoFocus onClick={onConfirm}>{confirmLabel}</button>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
