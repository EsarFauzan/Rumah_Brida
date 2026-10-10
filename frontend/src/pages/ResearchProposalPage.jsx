import { useEffect, useRef, useState } from 'react'
import { FileText as IconDoc, LockKeyhole as LockIcon, UserRound as IconUser, AlignLeft as IconTitle, Building as IconBuilding, MapPin as IconPin, ChevronDown as IconChevron, Check as IconCheck, ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-react'
import ServicePageHeader from '../components/ServicePageHeader'
import FieldRequirement from '../components/FieldRequirement'
import PdfUploadField from '../components/PdfUploadField'
import SubmissionReview from '../components/SubmissionReview'
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

const SECTIONS = [
  { id: 'peneliti', title: 'Informasi Peneliti', desc: 'Identitas peneliti dan judul riset.', fields: ['researcher_name', 'proposal_title'] },
  { id: 'institusi', title: 'Institusi & Lokasi', desc: 'Asal institusi dan koordinat lokasi riset.', fields: ['institution', 'research_coordinates'] },
  { id: 'isi', title: 'Isi Proposal', desc: 'Uraian BAB I sampai BAB III, maksimal 300 kata per BAB.', fields: ['chapter_one', 'chapter_two', 'chapter_three'] },
  { id: 'berkas', title: 'Berkas Proposal', desc: 'Unggah PDF proposal maksimal 5 MB.', fields: ['pdf'] },
]

const researchRequiredFields = ['researcher_name', 'proposal_title', 'institution', 'research_coordinates', 'chapter_one', 'chapter_two', 'chapter_three', 'pdf']

const countWords = (value) => value.trim() ? value.trim().split(/\s+/).length : 0
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const [stepIndex, setStepIndex] = useState(0)
  const savingRef = useRef(false)
  const formMainRef = useRef(null)
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

  const validateFieldOnBlur = (event) => {
    const { name, value } = event.target
    const validation = validateResearch({ ...form, [name]: value }, Boolean(existingPdfName))
    setErrors((current) => ({ ...current, [name]: validation[name] }))
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

  const goToStep = (index) => {
    if (index < 0 || index >= SECTIONS.length || index === stepIndex) return
    setStepIndex(index)
    requestAnimationFrame(() => {
      formMainRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' })
      requestAnimationFrame(() => {
        document.getElementById(`riset-step-title-${index}`)?.focus({ preventScroll: true })
      })
    })
  }

  const isFieldFilled = (key) => {
    if (key === 'pdf') return Boolean(form.pdf || existingPdfName)
    return hasValue(form[key])
  }
  const isSectionDone = (fields) => {
    const required = fields.filter((key) => researchRequiredFields.includes(key))
    return (required.length ? required : fields).every(isFieldFilled)
  }
  const completedRequiredCount = researchRequiredFields.filter(isFieldFilled).length
  const progressPercent = Math.round((completedRequiredCount / researchRequiredFields.length) * 100)

  const advanceStep = () => {
    const section = SECTIONS[stepIndex]
    const validation = validateResearch(form, Boolean(existingPdfName))
    const relevant = Object.fromEntries(Object.entries(validation).filter(([key]) => section.fields.includes(key)))
    setErrors((current) => ({ ...current, ...relevant }))
    if (Object.keys(relevant).length) {
      setFeedback({ type: 'error', message: 'Lengkapi data wajib pada tahap ini sebelum melanjutkan.' })
      focusFirstError(relevant)
      return
    }
    setFeedback(null)
    goToStep(stepIndex + 1)
  }

  const requestReview = () => {
    const validation = validateResearch(form, Boolean(existingPdfName))
    if (Object.keys(validation).length) {
      setErrors(validation)
      setFeedback({ type: 'error', message: 'Lengkapi bagian wajib sebelum meninjau proposal.' })
      focusFirstError(validation)
      const firstErrorKey = Object.keys(validation)[0]
      const errorStep = SECTIONS.findIndex((s) => s.fields.includes(firstErrorKey))
      if (errorStep !== -1 && errorStep !== stepIndex) goToStep(errorStep)
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
    setExistingPdfName('')
    setExistingPdfUrl('')
    setStepIndex(0)
    formMainRef.current?.scrollIntoView({
      behavior: reducedMotion() ? 'instant' : 'smooth',
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
        formMainRef.current?.scrollIntoView({
          behavior: reducedMotion() ? 'instant' : 'smooth',
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
        const firstErrorKey = Object.keys(fieldErrors)[0]
        const errorStep = SECTIONS.findIndex((s) => s.fields.includes(firstErrorKey))
        if (errorStep !== -1 && errorStep !== stepIndex) goToStep(errorStep)
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

  const labels = { researcher_name: 'Nama Peneliti', proposal_title: 'Judul Proposal', institution: 'Institusi', research_coordinates: 'Koordinat', chapter_one: 'BAB I', chapter_two: 'BAB II', chapter_three: 'BAB III', pdf: 'Berkas PDF' }
  const reviewSections = SECTIONS.map((section) => ({
    title: section.title,
    entries: section.fields.map((key) => [labels[key], form[key]?.name || form[key] || (key === 'pdf' && existingPdfName ? existingPdfName : '')]),
  }))

  if (!isAuthenticated) {
    return (
      <section className="access-gate-page">
        <div className="access-gate-card">
          <div className="access-gate-icon"><LockIcon size={26} aria-hidden="true" /></div>
          <p className="access-gate-kicker">Riset</p>
          <h1 className="access-gate-title">Masuk Terlebih Dahulu</h1>
          <p className="access-gate-desc">Pengajuan dan perubahan proposal riset hanya tersedia untuk pengguna yang sudah masuk.</p>
          <a className="access-gate-button" href="/masuk">Masuk Sekarang <ArrowRightIcon size={16} aria-hidden="true" /></a>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="research-page">
        <div className="research-form-card">
          <div className="form-loading">Memuat data proposal...</div>
        </div>
      </section>
    )
  }

  const activeSection = SECTIONS[stepIndex]
  const isLastStep = stepIndex === SECTIONS.length - 1

  return (
    <section className="research-page inovasi-wizard-page">
      <ServicePageHeader narrow section="Riset" title={isEditing ? 'Edit Proposal Riset' : 'Pengajuan Proposal Riset'} description="Sampaikan gagasan riset dan berkas pendukung Anda dalam empat tahap: Informasi Peneliti, Institusi & Lokasi, Isi Proposal, dan Berkas Proposal." action={<span className="form-status"><IconDoc size={16} aria-hidden="true" />{isEditing ? (proposalStatus === 'draft' ? 'Draft' : 'Diajukan') : 'Proposal baru'}</span>} />
      <div className="inovasi-wizard research-form-card" ref={formMainRef}>
        {completion ? (
          <div className="riset-completion form-feedback success" role="status">
            <h2>{completion.action === 'draft' ? 'Draft berhasil disimpan' : 'Proposal berhasil dikirim'}</h2>
            <p>{completion.message}</p>
            <p>{completion.action === 'draft' ? 'Apa yang ingin Anda lakukan selanjutnya?' : 'Proposal Anda sudah masuk ke Hasil Riset.'}</p>
            <div className="riset-completion-actions">
              <button className="secondary-form-button" type="button" onClick={startAnotherProposal}>Input Proposal Lagi</button>
              <button className="primary-form-button" type="button" onClick={viewSavedProposal}>{completion.action === 'draft' ? 'Lihat Draft Saya' : 'Lihat Hasil Riset'}</button>
            </div>
          </div>
        ) : (
          <>
            <nav className="wiz-steps-wrap" aria-label="Tahapan pengisian">
              <ol className="wiz-steps">
                {SECTIONS.map((section, index) => {
                  const done = isSectionDone(section.fields)
                  const isActive = index === stepIndex
                  return (
                    <li key={section.id} className={`wiz-step${isActive ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                      <button type="button" onClick={() => goToStep(index)} aria-current={isActive ? 'step' : undefined} aria-label={`Tahap ${index + 1}: ${section.title}`}>
                        <span className="wiz-step-dot">{done && !isActive ? <IconCheck size={14} aria-hidden="true" /> : index + 1}</span>
                        <span className="wiz-step-label">{section.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="wiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent} aria-label="Kelengkapan data wajib">
                <span className="wiz-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="wiz-progress-note">Tahap {stepIndex + 1} dari {SECTIONS.length} — {completedRequiredCount} dari {researchRequiredFields.length} data wajib terisi</p>
            </nav>

            {feedback && <div className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

            <form onSubmit={(event) => { event.preventDefault(); if (isLastStep) requestReview(); else advanceStep() }} noValidate>
              <section className="wiz-panel" aria-labelledby={`riset-step-title-${stepIndex}`}>
                <div className="wiz-panel-head">
                  <h2 id={`riset-step-title-${stepIndex}`} tabIndex={-1}>{activeSection.title}</h2>
                  <p>{activeSection.desc}</p>
                </div>

                {stepIndex === 0 && (
                  <div className="inovasi-grid2">
                    <label className="inovasi-field"><span className="field-label">Nama Peneliti<FieldRequirement /></span>
                      <div className="inovasi-input-wrap">
                        <IconUser className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input aria-required="true" aria-invalid={Boolean(errors.researcher_name)} name="researcher_name" value={form.researcher_name} onChange={updateField} onBlur={validateFieldOnBlur} placeholder="Masukkan nama lengkap" />
                      </div>
                      {errors.researcher_name && <small className="field-error">{errors.researcher_name}</small>}
                    </label>
                    <label className="inovasi-field"><span className="field-label">Judul Proposal<FieldRequirement /></span>
                      <div className="inovasi-input-wrap">
                        <IconTitle className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input aria-required="true" aria-invalid={Boolean(errors.proposal_title)} name="proposal_title" value={form.proposal_title} onChange={updateField} onBlur={validateFieldOnBlur} placeholder="Masukkan judul riset" />
                      </div>
                      {errors.proposal_title && <small className="field-error">{errors.proposal_title}</small>}
                    </label>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="inovasi-grid2">
                    <label className="inovasi-field"><span className="field-label">Asal Universitas/PT<FieldRequirement /></span>
                      <div className="inovasi-input-wrap">
                        <IconBuilding className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        {isCustomInstitution ? (
                          <>
                            <input aria-required="true" aria-invalid={Boolean(errors.institution)} name="institution" value={form.institution} onChange={updateField} onBlur={validateFieldOnBlur} maxLength={180} placeholder="Ketik nama universitas/PT" />
                            <button className="inovasi-chevron-button" type="button" aria-label="Pilih institusi dari daftar" onClick={selectInstitutionFromList}>
                              <IconChevron size={18} aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <>
                            <select aria-required="true" aria-invalid={Boolean(errors.institution)} name="institution" value={RESEARCH_INSTITUTIONS.includes(form.institution) ? form.institution : ''} onChange={updateInstitution} onBlur={validateFieldOnBlur}>
                              <option value="">Pilih institusi</option>
                              {RESEARCH_INSTITUTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                              <option value={OTHER_INSTITUTION}>{OTHER_INSTITUTION}</option>
                            </select>
                            <IconChevron className="inovasi-chevron" size={18} aria-hidden="true" />
                          </>
                        )}
                      </div>
                      {errors.institution && <small className="field-error">{errors.institution}</small>}
                    </label>
                    <label className="inovasi-field"><span className="field-label">Koordinat Riset<FieldRequirement /></span>
                      <div className="inovasi-input-wrap">
                        <IconPin className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input aria-required="true" aria-invalid={Boolean(errors.research_coordinates)} name="research_coordinates" value={form.research_coordinates} onChange={updateField} onBlur={validateFieldOnBlur} placeholder="Contoh: -0.9, 119.8" />
                      </div>
                      {errors.research_coordinates && <small className="field-error">{errors.research_coordinates}</small>}
                    </label>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className="wiz-chapters">
                    {chapters.map((chapter) => {
                      const words = countWords(form[chapter.name] || '')
                      const isOver = words > 300
                      return (
                        <div key={chapter.name} className="inovasi-field">
                          <div className="wiz-chapter-head">
                            <span className="field-label">{chapter.label} — {chapter.sub}<FieldRequirement /></span>
                            <span className={isOver ? 'riset-word-badge is-over' : 'riset-word-badge'}>{words}/300 kata</span>
                          </div>
                          <textarea id={chapter.name} aria-required="true" aria-invalid={Boolean(errors[chapter.name])} name={chapter.name} value={form[chapter.name]} onChange={updateField} onBlur={validateFieldOnBlur} placeholder={chapter.placeholder} rows={6} />
                          {errors[chapter.name] && <small className="field-error">{errors[chapter.name]}</small>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {stepIndex === 3 && (
                  <div className="wiz-file">
                    <span className="wiz-file-label"><IconDoc size={15} aria-hidden="true" /> Berkas proposal (PDF)<FieldRequirement required={!existingPdfName} /></span>
                    <PdfUploadField name="pdf" inputId="proposal-pdf" label="Berkas proposal" file={form.pdf} onChange={setPdfFile} error={errors.pdf} existingHref={existingPdfUrl} existingName={existingPdfName} maxMb={5} required={!existingPdfName} />
                  </div>
                )}

                <div className="wiz-footer">
                  {stepIndex > 0 ? (
                    <button className="secondary-form-button wiz-back" type="button" onClick={() => goToStep(stepIndex - 1)} disabled={isSaving}>
                      <ArrowLeftIcon size={16} aria-hidden="true" /> Kembali
                    </button>
                  ) : <span className="wiz-footer-spacer" aria-hidden="true" />}
                  <div className="wiz-footer-actions">
                    <button className="secondary-form-button wiz-draft" type="button" disabled={isSaving} onClick={() => submitProposal('draft')}>
                      Simpan Draft
                    </button>
                    {isLastStep ? (
                      <button className="primary-form-button wiz-next" type="submit" disabled={isSaving}>
                        Tinjau Proposal <ArrowRightIcon size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <button className="primary-form-button wiz-next" type="button" onClick={advanceStep}>
                        Lanjutkan <ArrowRightIcon size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </form>
          </>
        )}
      </div>
      {reviewOpen && <SubmissionReview title="Ringkasan Proposal" sections={reviewSections} onClose={() => setReviewOpen(false)} onConfirm={() => submitProposal('submit')} busy={isSaving} confirmLabel={isEditing && proposalStatus !== 'draft' ? 'Simpan Perubahan' : 'Kirim Proposal'} />}
    </section>
  )
}

export default ResearchProposalPage



