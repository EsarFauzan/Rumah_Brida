import { useCallback, useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function DeleteItemModal({
  open,
  itemTitle,
  title = 'Hapus Item?',
  description = 'Apakah Anda yakin ingin menghapus',
  warning = 'Data akan dihapus secara permanen dan tidak dapat dikembalikan.',
  confirmLabel = 'Hapus',
  deletingLabel = 'Menghapus...',
  isDeleting = false,
  onCancel,
  onConfirm,
  labelIds,
}) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const triggerRef = useRef(null)

  const requestClose = useCallback(() => {
    if (isDeleting) return
    onCancel()
  }, [isDeleting, onCancel])

  useEffect(() => {
    if (!open) return undefined

    const { body, documentElement } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    triggerRef.current = document.activeElement
    cancelRef.current?.focus()

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight

      const trigger = triggerRef.current
      triggerRef.current = null

      if (trigger instanceof HTMLElement && body.contains(trigger)) trigger.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      const focusable = dialog ? dialog.querySelectorAll(FOCUSABLE_SELECTOR) : []

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const isInside = dialog.contains(active)

      if (event.shiftKey && (!isInside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!isInside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, requestClose])

  if (!open) return null

  const displayTitle = itemTitle?.trim() || 'tanpa judul'

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) requestClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelIds.title}
        aria-describedby={labelIds.description}
        ref={dialogRef}
      >
        <button className="modal-close" type="button" aria-label="Tutup dialog" disabled={isDeleting} onClick={requestClose}>
          <X size={18} aria-hidden="true" />
        </button>

        <div className="modal-icon" aria-hidden="true"><Trash2 size={25} /></div>

        <h2 className="modal-title" id={labelIds.title}>{title}</h2>

        <p className="modal-description" id={labelIds.description}>
          {description} <span className="modal-target">{displayTitle}</span>?
        </p>

        <p className="modal-warning">{warning}</p>

        <div className="modal-actions">
          <button className="modal-button" type="button" disabled={isDeleting} onClick={requestClose} ref={cancelRef}>
            Batal
          </button>
          <button className="modal-button is-danger" type="button" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? (<><span className="modal-spinner" aria-hidden="true" />{deletingLabel}</>) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteItemModal
