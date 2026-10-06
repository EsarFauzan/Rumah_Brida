import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import ServicePageHeader from '../components/ServicePageHeader'
import SubmissionReview from '../components/SubmissionReview'
import FormProgress from '../components/FormProgress'
import FieldRequirement from '../components/FieldRequirement'
import PdfUploadField from '../components/PdfUploadField'
import { validateResearch, focusFirstError, hasValue } from '../utils/submission'
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

const RESEARCH_INSTITUTIONS = [
  'Universitas Tadulako',
  'UIN Datokarama Palu',
  'Universitas Alkhairaat',
  'STMIK Bina Mulia',
]
const OTHER_INSTITUTION = 'Institusi Lainnya'

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
  const [existingPdfUrl, setExistingPdfUrl] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [completion, setCompletion] = useState(null)
  const [isCustomInstitution, setIsCustomInstitution] = useState(false)
  const savingRef = useRef(false)
  const cardWrapRef = useRef(null)
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
        setIsCustomInstitution(Boolean(proposal.institution && !RESEARCH_INSTITUTIONS.includes(proposal.institution)))
        setExistingPdfName(proposal.pdf_original_name ?? '')
        setExistingPdfUrl(proposal.pdf_url ?? '')
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

  const updateInstitution = (event) => {
    const { value } = event.target
    if (value === OTHER_INSTITUTION) {
      setIsCustomInstitution(true)
      setForm((current) => ({ ...current, institution: '' }))
      setErrors((current) => ({ ...current, institution: undefined }))
      return
    }

    setIsCustomInstitution(false)
    updateField(event)
  }

  const selectInstitutionFromList = () => {
    setIsCustomInstitution(false)
    setForm((current) => ({ ...current, institution: '' }))
    setErrors((current) => ({ ...current, institution: undefined }))
  }

  const setPdfFile = (file) => {
    setForm((current) => ({ ...current, pdf: file ?? null }))
    setErrors((current) => ({ ...current, pdf: undefined }))
  }

  const completeness = [
    { title: 'Peneliti', done: hasValue(form.researcher_name) && hasValue(form.proposal_title) },
    { title: 'Institusi', done: hasValue(form.institution) && hasValue(form.research_coordinates) },
    { title: 'Isi proposal', done: chapters.every(chapter => hasValue(form[chapter.name]) && countWords(form[chapter.name]) <= 300) },
    { title: 'Berkas', done: Boolean(form.pdf || existingPdfName) && !validateResearch(form, Boolean(existingPdfName)).pdf },
  ]
  const reviewSections = [
    { title: 'Informasi peneliti', entries: [['Nama peneliti', form.researcher_name], ['Judul proposal', form.proposal_title], ['Institusi', form.institution], ['Koordinat', form.research_coordinates]] },
    { title: 'Isi proposal', entries: chapters.map(chapter => [chapter.label, form[chapter.name]]) },
    { title: 'Berkas proposal', entries: [['PDF', form.pdf?.name || existingPdfName]] },
  ]
  const requestReview = () => {
    const validation = validateResearch(form, Boolean(existingPdfName))
    setErrors(validation)
    if (Object.keys(validation).length) {
      setFeedback({ type: 'error', message: 'Lengkapi bagian wajib sebelum meninjau proposal.' })
      focusFirstError(validation)
      return
    }
    setFeedback(null)
    setReviewOpen(true)
  }

  const navigateTo = (destination, state = {}) => {
    window.history.pushState(state, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const startAnotherProposal = () => {
    setForm(initialForm)
    setIsCustomInstitution(false)
    setErrors({})
    setFeedback(null)
    setCompletion(null)
    cardWrapRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  const viewSavedProposal = () => {
    if (!completion) return
    navigateTo(completion.action === 'draft' ? '/riset/hasil#draft' : '/riset/hasil')
  }

  const submitProposal = async (action) => {
    if (savingRef.current) return
    savingRef.current = true
    setReviewOpen(false)
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
      if (isEditing) {
        if (proposalStatus === 'draft' && action === 'submit') {
          navigateTo('/riset/hasil', { researchSuccess: response.data.message })
          return
        }

        setFeedback({ type: 'success', message: response.data.message })
        window.setTimeout(() => {
          navigateTo(action === 'draft' ? '/riset/hasil#draft' : `/riset/hasil/${proposalId}`)
        }, 700)
      } else {
        setFeedback(null)
        setCompletion({ action, message: response.data.message })
        cardWrapRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start',
        })
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        const fieldErrors = Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]]))
        setErrors(fieldErrors)
        focusFirstError(fieldErrors)
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
      savingRef.current = false
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
      <ServicePageHeader narrow section="Riset" title={isEditing ? 'Edit Proposal Riset' : 'Pengajuan Proposal Riset'} description="Sampaikan gagasan riset dan berkas pendukung Anda." action={<span className="form-status"><FileText size={16} aria-hidden="true" />{isEditing ? (proposalStatus === 'draft' ? 'Draft' : 'Diajukan') : 'Proposal baru'}</span>} />

      <div className="riset-card-wrap" ref={cardWrapRef}>
        {!isLoading && !completion && <FormProgress sections={completeness} />}
        <div className="riset-card">
          {completion ? (
            <div className="riset-completion form-feedback success" role="status">
              <h2>{completion.action === 'draft' ? 'Draft berhasil disimpan' : 'Proposal berhasil dikirim'}</h2>
              <p>{completion.message}</p>
              <p>{completion.action === 'draft' ? 'Apa yang ingin Anda lakukan selanjutnya?' : 'Proposal Anda sudah masuk ke Hasil Riset.'}</p>
              <div className="riset-completion-actions">
                <button className="secondary-form-button" type="button" onClick={startAnotherProposal}>Input Proposal Lagi</button>
                <button className="primary-form-button" type="button" onClick={viewSavedProposal}>
                  {completion.action === 'draft' ? 'Lihat Draft Saya' : 'Lihat Hasil Riset'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}
              {isLoading ? <div className="form-loading">Memuat data proposal...</div> : (
            <form onSubmit={event => { event.preventDefault(); requestReview() }} noValidate>
              <p className="form-completion-note form-note-inset">Bagian wajib diperlukan untuk mengirim. Draft dapat disimpan sebelum lengkap.</p>

              <div className="riset-section">
                <div className="riset-section-head">
                  <div className="riset-section-num">1</div>
                  <div>
                    <h3>Informasi Peneliti</h3>
                  </div>
                </div>
                <div className="riset-grid2">
                  <label className="riset-field"><span className="field-label">Nama Peneliti<FieldRequirement /></span>
                    <div className="riset-input-wrap">
                      <IconUser />
                      <input aria-required="true" aria-invalid={Boolean(errors.researcher_name)} name="researcher_name" value={form.researcher_name} onChange={updateField} placeholder="Masukkan nama lengkap" />
                    </div>
                    {errors.researcher_name && <small className="field-error">{errors.researcher_name}</small>}
                  </label>
                  <label className="riset-field"><span className="field-label">Judul Proposal<FieldRequirement /></span>
                    <div className="riset-input-wrap">
                      <IconTitle />
                      <input aria-required="true" aria-invalid={Boolean(errors.proposal_title)} name="proposal_title" value={form.proposal_title} onChange={updateField} placeholder="Masukkan judul riset" />
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
                  </div>
                </div>
                <div className="riset-grid2">
                  <label className="riset-field"><span className="field-label">Asal Universitas/PT<FieldRequirement /></span>
                    <div className="riset-input-wrap">
                      <IconBuilding />
                      {isCustomInstitution ? (
                        <>
                          <input aria-required="true" aria-invalid={Boolean(errors.institution)} name="institution" value={form.institution} onChange={updateField} maxLength={180} placeholder="Ketik nama universitas/PT" />
                          <button className="inovasi-chevron-button" type="button" aria-label="Pilih institusi dari daftar" onClick={selectInstitutionFromList}>
                            <IconChevron aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <>
                          <select aria-required="true" aria-invalid={Boolean(errors.institution)} name="institution" value={form.institution} onChange={updateInstitution}>
                            <option value="">Pilih Institusi</option>
                            {RESEARCH_INSTITUTIONS.map((institution) => <option key={institution} value={institution}>{institution}</option>)}
                            <option value={OTHER_INSTITUTION}>{OTHER_INSTITUTION}</option>
                          </select>
                          <IconChevron />
                        </>
                      )}
                    </div>
                    {errors.institution && <small className="field-error">{errors.institution}</small>}
                  </label>
                  <label className="riset-field"><span className="field-label">Koordinat Penelitian<FieldRequirement /></span>
                    <div className="riset-input-wrap">
                      <IconPin />
                      <input aria-required="true" aria-invalid={Boolean(errors.research_coordinates)} name="research_coordinates" value={form.research_coordinates} onChange={updateField} placeholder="-0.8971, 119.8707" />
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
                  </div>
                </div>
                <div className="riset-chapters">
                  {chapters.map((chapter) => {
                    const words = countWords(form[chapter.name])
                    return (
                      <div className="riset-chapter" key={chapter.name}>
                        <div className="riset-chapter-head">
                          <div>
                            <label className="riset-chapter-label" htmlFor={chapter.name}>{chapter.label} <FieldRequirement /></label>
                            <span className="riset-chapter-sub">{chapter.sub}</span>
                          </div>
                          <span className={words > 300 ? 'riset-word-badge is-over' : 'riset-word-badge'}>{words}/300 kata</span>
                        </div>
                        <textarea id={chapter.name} aria-required="true" aria-invalid={Boolean(errors[chapter.name])} name={chapter.name} value={form[chapter.name]} onChange={updateField} placeholder={chapter.placeholder} rows="6" />
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
                    <h3>Berkas Proposal <FieldRequirement /></h3>
                  </div>
                </div>

                <PdfUploadField name="pdf" inputId="proposal-pdf" label="Berkas proposal" file={form.pdf} onChange={setPdfFile} error={errors.pdf} existingHref={existingPdfUrl} existingName={existingPdfName} maxMb={5} required={!existingPdfName} />
              </div>

              <div className="riset-footer-bar">
                <div className="form-actions" style={{ margin: 0 }}>
                  {isEditing ? (
                    <a className="secondary-form-link" href={proposalStatus === 'draft' ? '/riset/hasil#draft' : `/riset/hasil/${proposalId}`}>Batal</a>
                  ) : (
                    <button className="secondary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>Simpan Draft</button>
                  )}
                  {isEditing && proposalStatus === 'draft' && (
                    <button className="secondary-form-button" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>Simpan Draft</button>
                  )}
                  <button className="primary-form-button" type="submit" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Tinjau Proposal'}
                  </button>
                </div>
              </div>
            </form>
              )}
            </>
          )}
        </div>
      </div>
      {reviewOpen && <SubmissionReview title="Ringkasan Proposal" sections={reviewSections} onClose={() => setReviewOpen(false)} onConfirm={() => submitProposal('submit')} busy={isSaving} confirmLabel={isEditing && proposalStatus !== 'draft' ? 'Simpan Perubahan' : 'Kirim Proposal'} />}
    </section>
  )
}

export default ResearchProposalPage
