import { useEffect, useState } from 'react'
import api from '../services/api'

const initialForm = {
  researcher_name: '',
  proposal_title: '',
  institution: '',
  research_coordinates: '',
  chapter_one: '',
  chapter_two: '',
  chapter_three: '',
  pdf: null,
}

const chapters = [
  { name: 'chapter_one', label: 'BAB I (Pendahuluan, Permasalahan, Tujuan)', placeholder: 'Tuliskan pendahuluan...' },
  { name: 'chapter_two', label: 'BAB II (Rancang Bangun / Ringkasan)', placeholder: 'Tuliskan ringkasan...' },
  { name: 'chapter_three', label: 'BAB III (Hasil Yang dituju)', placeholder: 'Tuliskan hasil yang diharapkan...' },
]

const countWords = (value) => value.trim() ? value.trim().split(/\s+/).length : 0

function ResearchProposalPage({ proposalId = null }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(proposalId))
  const [existingPdfName, setExistingPdfName] = useState('')
  const isEditing = Boolean(proposalId)

  useEffect(() => {
    if (!proposalId) return

    api.get(`/research-proposals/${proposalId}`)
      .then((response) => {
        const proposal = response.data.data
        setForm({
          researcher_name: proposal.researcher_name ?? '',
          proposal_title: proposal.proposal_title ?? '',
          institution: proposal.institution ?? '',
          research_coordinates: proposal.research_coordinates ?? '',
          chapter_one: proposal.chapter_one ?? '',
          chapter_two: proposal.chapter_two ?? '',
          chapter_three: proposal.chapter_three ?? '',
          pdf: null,
        })
        setExistingPdfName(proposal.pdf_original_name ?? '')
      })
      .catch(() => setFeedback({ type: 'error', message: 'Proposal yang akan diedit tidak dapat dimuat.' }))
      .finally(() => setIsLoading(false))
  }, [proposalId])

  const updateField = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] ?? null : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const submitProposal = async (action) => {
    setIsSaving(true)
    setErrors({})
    setFeedback(null)

    const payload = new FormData()
    payload.append('action', action)
    if (isEditing) payload.append('_method', 'PUT')
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') payload.append(key, value)
    })

    try {
      const endpoint = isEditing ? `/research-proposals/${proposalId}` : '/research-proposals'
      const response = await api.post(endpoint, payload)
      setFeedback({ type: 'success', message: response.data.message })
      const fileInput = document.getElementById('proposal-pdf')
      if (fileInput) fileInput.value = ''

      if (!isEditing) setForm(initialForm)

      if (isEditing || action === 'submit') {
        window.setTimeout(() => {
          window.history.pushState({}, '', isEditing ? `/riset/hasil/${proposalId}` : '/riset/hasil')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }, 700)
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]])))
        setFeedback({ type: 'error', message: 'Periksa kembali data proposal yang diisi.' })
      } else {
        setFeedback({ type: 'error', message: 'Tidak dapat terhubung ke server. Pastikan backend Laravel sedang berjalan.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="research-page">
      <div className="research-form-card">
        <header className="research-form-header">
          <p>Riset</p>
          <h1>{isEditing ? 'Edit Proposal Riset' : 'Pengajuan Proposal Riset'}</h1>
        </header>

        {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

        {isLoading ? <div className="form-loading">Memuat data proposal...</div> : (

        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="research-fields-grid">
            <label>Nama Peneliti
              <input name="researcher_name" value={form.researcher_name} onChange={updateField} placeholder="Masukkan nama lengkap" />
              {errors.researcher_name && <small className="field-error">{errors.researcher_name}</small>}
            </label>
            <label>Judul Proposal
              <input name="proposal_title" value={form.proposal_title} onChange={updateField} placeholder="Masukkan judul riset" />
              {errors.proposal_title && <small className="field-error">{errors.proposal_title}</small>}
            </label>
            <label>Asal Universitas/PT
              <select name="institution" value={form.institution} onChange={updateField}>
                <option value="">Pilih Institusi</option>
                <option>Universitas Tadulako</option>
                <option>UIN Datokarama Palu</option>
                <option>Universitas Alkhairaat</option>
                <option>STMIK Bina Mulia</option>
                <option>Institusi Lainnya</option>
              </select>
              {errors.institution && <small className="field-error">{errors.institution}</small>}
            </label>
            <label>Koordinat Penelitian
              <input name="research_coordinates" value={form.research_coordinates} onChange={updateField} placeholder="-0.8971, 119.8707" />
              {errors.research_coordinates && <small className="field-error">{errors.research_coordinates}</small>}
            </label>
          </div>

          <fieldset className="proposal-content">
            <legend>Isi Proposal</legend>
            {chapters.map((chapter) => {
              const words = countWords(form[chapter.name])
              return (
                <label key={chapter.name}>{chapter.label}
                  <span className={words > 300 ? 'word-count is-over' : 'word-count'}>{words}/300 kata</span>
                  <textarea name={chapter.name} value={form[chapter.name]} onChange={updateField} placeholder={chapter.placeholder} rows="6" />
                  {errors[chapter.name] && <small className="field-error">{errors[chapter.name]}</small>}
                </label>
              )
            })}
          </fieldset>

          <label className="file-field">File Proposal (PDF)
            <input id="proposal-pdf" name="pdf" type="file" accept="application/pdf,.pdf" onChange={updateField} />
            <small>{isEditing && existingPdfName ? `PDF saat ini: ${existingPdfName}. Pilih file hanya jika ingin mengganti.` : 'Maksimal ukuran file 5 MB'}</small>
            {errors.pdf && <small className="field-error">{errors.pdf}</small>}
          </label>

          <div className="form-actions">
            {isEditing ? (
              <a className="secondary-form-link" href={`/riset/hasil/${proposalId}`}>Batal</a>
            ) : (
              <button className="secondary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>Simpan Draft</button>
            )}
            <button className="primary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('submit')}>
              {isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Kirim Proposal'}
            </button>
          </div>
        </form>
        )}
      </div>
    </section>
  )
}

export default ResearchProposalPage
