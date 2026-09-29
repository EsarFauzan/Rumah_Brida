import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function ServiceDialog({ title, children, footer, onClose, busy = false, className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    if (scrollbar) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [])
  return createPortal(
    <dialog ref={ref} className={`service-dialog ${className}`} aria-labelledby={titleId}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) onClose() } }}
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div className="service-dialog-content">
        <header><h2 id={titleId}>{title}</h2><button className="service-icon-button" type="button" aria-label="Tutup dialog" onClick={onClose} disabled={busy}><X size={20} aria-hidden="true" /></button></header>
        <div className="service-dialog-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </dialog>, document.body,
  )
}
