import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

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
  { name: 'chapter_one', label: 'BAB I', sub: 'Pendahuluan, Permasalahan, Tujuan', placeholder: 'Tuliskan pendahuluan...' },
  { name: 'chapter_two', label: 'BAB II', sub: 'Rancang Bangun / Ringkasan', placeholder: 'Tuliskan ringkasan...' },
  { name: 'chapter_three', label: 'BAB III', sub: 'Hasil Yang Dituju', placeholder: 'Tuliskan hasil yang diharapkan...' },
]

const countWords = (value) => value.trim() ? value.trim().split(/\s+/).length : 0

const IconUser = () => (
  <svg className="riset-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const IconTitle = () => (
  <svg className="riset-icon" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const IconBuilding = () => (
  <svg className="riset-icon" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8 8h1.5M8 12h1.5M8 16h1.5M14.5 8H16M14.5 12H16M14.5 16H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const IconPin = () => (
  <svg className="riset-icon" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" /></svg>
)
const IconChevron = () => (
  <svg className="riset-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const IconUpload = () => (
  <svg className="riset-upicon" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)
const IconDoc = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
)

function ResearchProposalPage({ proposalId = null }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(proposalId))
  const [existingPdfName, setExistingPdfName] = useState('')
  const [proposalStatus, setProposalStatus] = useState('draft')
  const [dragOver, setDragOver] = useState(false)
  const { isAuthenticated } = useAuth()
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
        setProposalStatus(proposal.status ?? 'draft')
      })
      .catch(() => setFeedback({ type: 'error', message: 'Proposal yang akan diedit tidak dapat dimuat.' }))
      .finally(() => setIsLoading(false))
  }, [proposalId])

  const updateField = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] ?? null : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const setPdfFile = (file) => {
    setForm((current) => ({ ...current, pdf: file ?? null }))
    setErrors((current) => ({ ...current, pdf: undefined }))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      const input = document.getElementById('proposal-pdf')
      if (input) {
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
      }
    }
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

      window.setTimeout(() => {
        const destination = action === 'draft'
          ? '/riset/draft'
          : isEditing ? `/riset/hasil/${proposalId}` : '/riset/hasil'

        window.history.pushState({}, '', destination)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, 700)
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]])))
        setFeedback({ type: 'error', message: 'Periksa kembali data proposal yang diisi.' })
      } else if (error.response?.status === 401) {
        setFeedback({ type: 'error', message: 'Sesi Anda berakhir. Silakan masuk kembali untuk menyimpan proposal.' })
      } else if (error.response?.status === 403) {
        setFeedback({ type: 'error', message: 'Anda tidak berhak mengubah proposal ini.' })
      } else if (error.response?.status === 429) {
        setFeedback({ type: 'error', message: 'Terlalu banyak pengiriman. Tunggu sebentar lalu coba lagi.' })
      } else {
        setFeedback({ type: 'error', message: 'Tidak dapat terhubung ke server. Pastikan backend Laravel sedang berjalan.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="access-gate-page">
        <div className="access-gate-card">
          <div className="access-gate-icon"><IconDoc /></div>
          <p className="access-gate-kicker">Riset</p>
          <h1 className="access-gate-title">Masuk Terlebih Dahulu</h1>
          <p className="access-gate-desc">Pengajuan dan perubahan proposal riset hanya tersedia untuk pengguna yang sudah masuk.</p>
          <div className="access-gate-actions">
            <a className="access-gate-link" href="/riset/hasil">Lihat Hasil Riset</a>
            <a className="access-gate-button" href="/masuk">
              Masuk Sekarang
              <IconChevron />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="riset-page">
      <div className="riset-hero">
        <div className="riset-hero-inner">
          <div>
            <div className="riset-crumb">
              Riset <span className="riset-crumb-dot" /> <b>{isEditing ? 'Edit Proposal' : 'Pengajuan Proposal'}</b>
            </div>
            <h1>{isEditing ? 'Edit Proposal Riset' : 'Pengajuan Proposal Riset'}</h1>
            <p>Lengkapi data proposal riset dengan informasi yang akurat dan berkas pendukung yang sesuai.</p>
          </div>
          <div className="riset-hero-badge">
            <IconDoc />
            <span>{isEditing ? (proposalStatus === 'draft' ? 'Draft' : 'Diajukan') : 'Formulir Baru'}</span>
          </div>
        </div>
      </div>

      <div className="riset-card-wrap">
        <div className="riset-card">
          {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

          {isLoading ? <div className="form-loading">Memuat data proposal...</div> : (
            <form onSubmit={(event) => event.preventDefault()} noValidate>

              <div className="riset-section">
                <div className="riset-section-head">
                  <div className="riset-section-num">1</div>
                  <div>
                    <h3>Informasi Peneliti</h3>
                    <p>Data diri peneliti dan judul proposal riset</p>
                  </div>
                </div>
                <div className="riset-grid2">
                  <label className="riset-field">Nama Peneliti
                    <div className="riset-input-wrap">
                      <IconUser />
                      <input name="researcher_name" value={form.researcher_name} onChange={updateField} placeholder="Masukkan nama lengkap" />
                    </div>
                    {errors.researcher_name && <small className="field-error">{errors.researcher_name}</small>}
                  </label>
                  <label className="riset-field">Judul Proposal
                    <div className="riset-input-wrap">
                      <IconTitle />
                      <input name="proposal_title" value={form.proposal_title} onChange={updateField} placeholder="Masukkan judul riset" />
                    </div>
                    {errors.proposal_title && <small className="field-error">{errors.proposal_title}</small>}
                  </label>
                </div>
              </div>

              <div className="riset-section">
                <div className="riset-section-head">
                  <div className="riset-section-num">2</div>
                  <div>
                    <h3>Institusi &amp; Lokasi</h3>
                    <p>Asal institusi dan titik koordinat penelitian</p>
                  </div>
                </div>
                <div className="riset-grid2">
                  <label className="riset-field">Asal Universitas/PT
                    <div className="riset-input-wrap">
                      <IconBuilding />
                      <select name="institution" value={form.institution} onChange={updateField}>
                        <option value="">Pilih Institusi</option>
                        <option>Universitas Tadulako</option>
                        <option>UIN Datokarama Palu</option>
                        <option>Universitas Alkhairaat</option>
                        <option>STMIK Bina Mulia</option>
                        <option>Institusi Lainnya</option>
                      </select>
                      <IconChevron />
                    </div>
                    {errors.institution && <small className="field-error">{errors.institution}</small>}
                  </label>
                  <label className="riset-field">Koordinat Penelitian
                    <div className="riset-input-wrap">
                      <IconPin />
                      <input name="research_coordinates" value={form.research_coordinates} onChange={updateField} placeholder="-0.8971, 119.8707" />
                    </div>
                    {errors.research_coordinates && <small className="field-error">{errors.research_coordinates}</small>}
                  </label>
                </div>
              </div>

              <div className="riset-section">
                <div className="riset-section-head">
                  <div className="riset-section-num">3</div>
                  <div>
                    <h3>Isi Proposal</h3>
                    <p>Uraikan pendahuluan, rancang bangun, dan hasil yang dituju</p>
                  </div>
                </div>
                <div className="riset-chapters">
                  {chapters.map((chapter) => {
                    const words = countWords(form[chapter.name])
                    return (
                      <div className="riset-chapter" key={chapter.name}>
                        <div className="riset-chapter-head">
                          <div>
                            <span className="riset-chapter-label">{chapter.label}</span>
                            <span className="riset-chapter-sub">{chapter.sub}</span>
                          </div>
                          <span className={words > 300 ? 'riset-word-badge is-over' : 'riset-word-badge'}>{words}/300 kata</span>
                        </div>
                        <textarea name={chapter.name} value={form[chapter.name]} onChange={updateField} placeholder={chapter.placeholder} rows="6" />
                        {errors[chapter.name] && <small className="field-error">{errors[chapter.name]}</small>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="riset-section">
                <div className="riset-section-head">
                  <div className="riset-section-num">4</div>
                  <div>
                    <h3>Berkas Proposal</h3>
                    <p>Unggah dokumen proposal lengkap dalam format PDF</p>
                  </div>
                </div>

                {form.pdf ? (
                  <div className="riset-file-chip">
                    <span className="riset-fi"><IconCheck /></span>
                    <span className="riset-fname">{form.pdf.name}</span>
                    <span className="riset-rm" role="button" tabIndex={0} onClick={() => { setPdfFile(null); document.getElementById('proposal-pdf').value = '' }}>
                      <IconX />
                    </span>
                  </div>
                ) : (
                  <>
                    <label
                      className={`riset-drop ${dragOver ? 'drag' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <IconUpload />
                      <p>Klik atau seret file PDF ke sini</p>
                      <small>Format PDF, maksimal ukuran file 5 MB</small>
                      <input id="proposal-pdf" name="pdf" type="file" accept="application/pdf,.pdf" onChange={updateField} />
                    </label>
                    {isEditing && existingPdfName && (
                      <small className="riset-existing-file">
                        <IconFile /> PDF saat ini: <strong>{existingPdfName}</strong> — kosongkan jika tidak ingin mengganti
                      </small>
                    )}
                  </>
                )}
                {errors.pdf && <small className="field-error" style={{ display: 'block', marginTop: 8 }}>{errors.pdf}</small>}
              </div>

              <div className="riset-footer-bar">
                <div className="form-actions" style={{ margin: 0 }}>
                  {isEditing ? (
                    <a className="secondary-form-link" href={proposalStatus === 'draft' ? '/riset/draft' : `/riset/hasil/${proposalId}`}>Batal</a>
                  ) : (
                    <button className="secondary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>Simpan Draft</button>
                  )}
                  {isEditing && proposalStatus === 'draft' && (
                    <button className="secondary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>Simpan Draft</button>
                  )}
                  <button className="primary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('submit')}>
                    {isSaving ? 'Menyimpan...' : isEditing && proposalStatus !== 'draft' ? 'Simpan Perubahan' : 'Kirim Proposal'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default ResearchProposalPage