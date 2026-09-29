import { useState } from 'react'
import { Check, Upload, X } from 'lucide-react'
import PdfPreviewLink from './PdfPreviewLink'

export default function PdfUploadField({ name, inputId, label, file, onChange, error, existingHref, existingName, maxMb = 10, required = false }) {
  const [drag, setDrag] = useState(false)
  const receive = event => {
    event.preventDefault()
    setDrag(false)
    if (event.dataTransfer.files?.[0]) onChange(event.dataTransfer.files[0])
  }
  return <div>
    {file && <div className="inovasi-file-chip"><span className="inovasi-fi"><Check size={16} aria-hidden="true" /></span><span className="inovasi-fname">{file.name}</span><button type="button" className="upload-remove" aria-label={`Hapus ${label}`} onClick={() => { onChange(null); const input = document.getElementById(inputId); if (input) input.value = '' }}><X size={18} aria-hidden="true" /></button></div>}
    <label className={`inovasi-drop${drag ? ' drag' : ''}${file ? ' has-file' : ''}`} onDragOver={event => { event.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={receive}>
      <Upload className="inovasi-upicon" aria-hidden="true" />
      <p>{file ? 'Ganti berkas PDF' : 'Pilih atau seret berkas PDF'}</p><small>Maksimal {maxMb} MB</small>
      <input id={inputId} name={name} type="file" accept="application/pdf,.pdf" aria-label={label} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={event => onChange(event.target.files?.[0] || null)} />
    </label>
    {existingHref && !file && <div className="upload-existing"><span>Berkas tersimpan: </span><PdfPreviewLink href={existingHref} filename={existingName}>{existingName || 'Lihat PDF'}</PdfPreviewLink><small>Dipertahankan jika tidak diganti.</small></div>}
    {error && <small id={`${inputId}-error`} className="field-error" role="alert">{error}</small>}
  </div>
}
