import { Send } from 'lucide-react'
import ServiceDialog from './ServiceDialog'

export default function SubmissionReview({ title, sections, onClose, onConfirm, busy, confirmLabel }) {
  return <ServiceDialog title={title} onClose={onClose} busy={busy} className="review-dialog" footer={<>
    <button type="button" className="secondary-form-button" disabled={busy} onClick={onClose}>Kembali mengedit</button>
    <button type="button" className="primary-form-button" disabled={busy} onClick={onConfirm}><Send size={16} aria-hidden="true" />{busy ? 'Menyimpan...' : confirmLabel}</button>
  </>}>
    {sections.map(section => <section className="submission-review-section" key={section.title}><h3>{section.title}</h3><dl>{section.entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Tidak diisi'}</dd></div>)}</dl></section>)}
  </ServiceDialog>
}
