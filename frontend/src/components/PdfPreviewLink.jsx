import { useEffect, useState } from 'react'
import { Download, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import ServiceDialog from './ServiceDialog'

function PdfPreview({ href, filename, onClose }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl
    const timeout = window.setTimeout(() => controller.abort('timeout'), 30000)
    fetch(href, { signal: controller.signal, credentials: 'omit' })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 403 ? 'Tautan dokumen sudah kedaluwarsa. Tutup pratinjau dan muat ulang daftar.' : 'Dokumen tidak dapat dimuat.')
        const blob = await response.blob()
        if (!(await blob.slice(0, 1024).text()).includes('%PDF-')) throw new Error('Berkas yang diterima bukan PDF yang valid.')
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        setUrl(objectUrl)
      })
      .catch(reason => {
        if (!controller.signal.aborted || controller.signal.reason === 'timeout') setError(reason.message === 'Failed to fetch' || controller.signal.aborted ? 'Dokumen belum dapat dimuat. Coba lagi atau buka di tab baru.' : reason.message)
      })
      .finally(() => window.clearTimeout(timeout))
    return () => { controller.abort(); window.clearTimeout(timeout); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [href, attempt])
  const downloadName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  return <ServiceDialog title={filename} className="pdf-dialog" onClose={onClose} footer={<>
    <a className="secondary-form-link" href={href} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Buka tab baru</a>
    {url ? <a className="primary-form-link" href={url} download={downloadName}><Download size={16} aria-hidden="true" /> Unduh PDF</a> : <button className="primary-form-button" disabled><Download size={16} aria-hidden="true" /> Unduh PDF</button>}
  </>}>
    {error ? <div className="pdf-feedback" role="alert"><FileText size={32} aria-hidden="true" /><p>{error}</p><button type="button" className="secondary-form-button" onClick={() => { setUrl(''); setError(''); setAttempt(n => n + 1) }}><RefreshCw size={16} aria-hidden="true" /> Coba lagi</button></div>
      : url ? <object className="pdf-preview" data={url} type="application/pdf" aria-label={`Pratinjau ${filename}`}><p>Pratinjau tidak didukung browser ini. Gunakan tombol Buka tab baru atau Unduh PDF.</p></object>
        : <div className="pdf-feedback" role="status">Memuat dokumen...</div>}
  </ServiceDialog>
}

export default function PdfPreviewLink({ href, filename = 'Dokumen.pdf', className = '', children }) {
  const [open, setOpen] = useState(false)
  return <>
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-haspopup="dialog"
      onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); setOpen(true) }}>{children}</a>
    {open && <PdfPreview href={href} filename={filename || 'Dokumen.pdf'} onClose={() => setOpen(false)} />}
  </>
}
