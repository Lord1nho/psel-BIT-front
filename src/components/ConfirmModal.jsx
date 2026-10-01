import { useEffect } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { AlertTriangle } from 'lucide-react'

// Modal de confirmação. Esc ou clique no fundo cancelam; o foco inicial fica no botão seguro (cancelar).
export default function ConfirmModal({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

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
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon"><AlertTriangle size={22} /></div>
            <h3 id="modal-title">{title}</h3>
            <p className="muted">{children}</p>
            <div className="row end">
              <button type="button" className="btn primary" autoFocus onClick={onCancel}>{cancelLabel}</button>
              <button type="button" className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
