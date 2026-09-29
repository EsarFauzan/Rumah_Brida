import { Check, Circle } from 'lucide-react'

export default function FormProgress({ sections }) {
  return <ol className="form-completion" aria-label="Kelengkapan pengajuan">{sections.map(section => <li key={section.title} className={section.done ? 'is-done' : ''}>
    {section.done ? <Check size={15} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}<span>{section.title}</span><small>{section.done ? 'Lengkap' : section.optional ? 'Opsional' : 'Belum lengkap'}</small>
  </li>)}</ol>
}
