import { useEffect } from 'react'

function ConfirmModal({ open, title, description, target, warning, confirmLabel = 'Hapus', isProcessing, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isProcessing) onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isProcessing, onCancel])

  if (!open) return null

  return (
    <div className="cm-overlay" onClick={() => !isProcessing && onCancel()}>
      <style>{styles}</style>
      <div className="cm-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="cm-close" type="button" onClick={onCancel} disabled={isProcessing} aria-label="Tutup">
          <CloseIcon />
        </button>

        <div className="cm-icon-wrap">
          <div className="cm-icon-ring" />
          <div className="cm-icon">
            <TrashIcon />
          </div>
        </div>

        {title && <h2 className="cm-title">{title}</h2>}

        <p className="cm-description">
          {description} {target && <span className="cm-target">{target}</span>}
        </p>

        {warning && (
          <div className="cm-warning">
            <WarningIcon />
            <span>{warning}</span>
          </div>
        )}

        <div className="cm-actions">
          <button className="cm-btn cm-btn-cancel" type="button" onClick={onCancel} disabled={isProcessing}>
            Batal
          </button>
          <button className="cm-btn cm-btn-danger" type="button" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing && <span className="cm-spinner" />}
            {isProcessing ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

const styles = `
.cm-overlay {
  position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 20px;
  background: rgba(7, 27, 53, .6); backdrop-filter: blur(4px); overflow-y: auto;
  animation: cm-fade 180ms ease;
}

.cm-card {
  position: relative; width: min(440px, 100%); padding: 34px 30px 28px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  box-shadow: 0 24px 60px rgba(7, 27, 53, .32); text-align: center;
  animation: cm-pop 260ms cubic-bezier(.2,.9,.3,1.2);
}

.cm-close {
  position: absolute; top: 14px; right: 14px; width: 32px; height: 32px;
  display: grid; place-items: center; padding: 0; color: var(--text-faint);
  background: transparent; border: 0; border-radius: 8px; cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease, transform 150ms ease;
}
.cm-close:hover:not(:disabled) { color: var(--navy-deep); background: var(--surface-hover); transform: rotate(90deg); }
.cm-close:disabled { cursor: wait; opacity: .5; }

.cm-icon-wrap { position: relative; width: 72px; height: 72px; margin: 0 auto 20px; display: grid; place-items: center; }

.cm-icon-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: var(--danger-bg); animation: cm-pulse 2.2s ease-in-out infinite;
}

.cm-icon {
  position: relative; width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(145deg, #e5453a, #b42318);
  color: #fff; display: grid; place-items: center;
  box-shadow: 0 8px 20px -4px rgba(180, 35, 24, .5);
}

.cm-title { margin: 0 0 10px; color: var(--navy-deep); font-family: var(--font-display); font-size: 19px; font-weight: 750; }

.cm-description { margin: 0 0 6px; color: var(--text-secondary); font-size: 14px; line-height: 1.6; }

.cm-target { display: inline-block; margin-top: 4px; padding: 3px 10px; overflow-wrap: anywhere; color: var(--navy-deep); background: var(--bg-soft); border-radius: 6px; font-weight: 700; font-size: 13.5px; }

.cm-warning {
  display: flex; align-items: flex-start; gap: 9px; margin: 18px 0 6px; padding: 12px 14px;
  color: var(--danger-strong); background: var(--danger-bg); border: 1px solid var(--danger-line);
  border-radius: 10px; font-size: 12.5px; line-height: 1.55; text-align: left;
}
.cm-warning svg { color: var(--danger); }

.cm-actions { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }

.cm-btn {
  flex: 1 1 0; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0 16px; border-radius: 10px; font-family: var(--font-display); font-size: 13.5px; font-weight: 700;
  cursor: pointer; border: 1px solid transparent; transition: transform 150ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease;
}
.cm-btn:disabled { cursor: wait; opacity: .65; }

.cm-btn-cancel {
  color: var(--navy); background: var(--surface); border-color: var(--action-border);
}
.cm-btn-cancel:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--navy); }

.cm-btn-danger {
  color: #fff; background: linear-gradient(135deg, #d5453a, #b42318);
  box-shadow: 0 8px 18px -6px rgba(180, 35, 24, .5);
}
.cm-btn-danger:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 24px -6px rgba(180, 35, 24, .55); }

.cm-spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff;
  border-radius: 50%; animation: cm-spin .7s linear infinite;
}

@keyframes cm-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cm-pop { from { opacity: 0; transform: translateY(14px) scale(.94); } to { opacity: 1; transform: none; } }
@keyframes cm-pulse { 0%, 100% { transform: scale(1); opacity: .5; } 50% { transform: scale(1.12); opacity: .15; } }
@keyframes cm-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .cm-overlay, .cm-card { animation: none; }
  .cm-icon-ring { animation: none; }
  .cm-close, .cm-btn { transition-duration: 1ms; }
}

@media (max-width: 480px) {
  .cm-card { padding: 28px 22px 24px; }
  .cm-actions { flex-direction: column-reverse; }
}
`

export default ConfirmModal