import { useEffect, useRef, useState } from 'react'
import { Hash, CalendarDays, Building2, AlignLeft as IconTitle, UserRound as IconUser, Layers as IconLayers, Building as IconBuilding, ChevronDown as IconChevron, Check as IconCheck, FileText as IconFile, LockKeyhole as LockIcon, ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-react'
import ServicePageHeader from '../components/ServicePageHeader'
import FieldRequirement from '../components/FieldRequirement'
import PdfUploadField from '../components/PdfUploadField'
import SubmissionReview from '../components/SubmissionReview'
import { innovationPdfUrl } from '../utils/fileUrl'
import { innovationRequiredFields, validateInnovation, focusFirstError, hasValue } from '../utils/submission'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

const OTHER_GOVERNMENT_AFFAIR = 'Urusan Pemerintahan Lainnya'
const OTHER_INNOVATION_TYPE = 'Inovasi Daerah Lainnya'

const initialForm = {
  title: '',
  innovator_name: '',
  registration_number: '',
  reporting_year: new Date().getFullYear(),
  innovation_type: '',
  government_affair: '',
  regional_agency: '',
  trial_date: '',
  implementation_date: '',
  ratification_date: '',
  profile_pdf: null,
  report_pdf: null,
}

const SECTIONS = [
  { id: 'info', title: 'Informasi Utama', desc: 'Identitas dasar untuk pencatatan inovasi.', fields: ['title', 'innovator_name', 'registration_number', 'reporting_year'] },
  { id: 'klasifikasi', title: 'Bentuk Inovasi', desc: 'Klasifikasikan inovasi sesuai cakupan pelaksanaannya.', fields: ['innovation_type', 'government_affair', 'regional_agency'] },
  { id: 'timeline', title: 'Timeline', desc: 'Catat perkembangan inovasi pada setiap tahap pelaksanaan.', fields: ['trial_date', 'implementation_date', 'ratification_date'] },
  { id: 'berkas', title: 'Berkas Pendukung', desc: 'Profil dan laporan dapat ditambahkan saat tersedia.', fields: ['profile_pdf', 'report_pdf'] },
]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches


function InnovationForm({ innovationId }) {
  const isEditMode = Boolean(innovationId)
  const [form, setForm] = useState(initialForm)
  const [options, setOptions] = useState({ innovation_types: [], government_affairs: [] })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [completion, setCompletion] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode)
  const [isCustomInnovationType, setIsCustomInnovationType] = useState(false)
  const [isCustomGovernmentAffair, setIsCustomGovernmentAffair] = useState(false)
  const [existingFiles, setExistingFiles] = useState({ profile_pdf_path: null, report_pdf_path: null })
  const [reviewOpen, setReviewOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const savingRef = useRef(false)
  const formMainRef = useRef(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    api.get('/innovations/options')
      .then((response) => setOptions(response.data))
      .catch(() => setOptions({ innovation_types: [], government_affairs: [] }))
  }, [])

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()
    api.get(`/innovations/${innovationId}`, { signal: controller.signal })
      .then((response) => {
        const data = response.data.data
        setForm({
          title: data.title ?? '',
          innovator_name: data.innovator_name ?? '',
          registration_number: data.registration_number ?? '',
          reporting_year: data.reporting_year ?? new Date().getFullYear(),
          innovation_type: data.innovation_type ?? '',
          government_affair: data.government_affair ?? '',
          regional_agency: data.regional_agency ?? '',
          trial_date: data.trial_date ? data.trial_date.slice(0, 10) : '',
          implementation_date: data.implementation_date ? data.implementation_date.slice(0, 10) : '',
          ratification_date: data.ratification_date ? data.ratification_date.slice(0, 10) : '',
          profile_pdf: null,
          report_pdf: null,
        })
        setExistingFiles({
          profile_pdf_path: data.profile_pdf_path ?? null,
          report_pdf_path: data.report_pdf_path ?? null,
          profile_pdf_original_name: data.profile_pdf_original_name,
          report_pdf_original_name: data.report_pdf_original_name,
        })
      })
      .catch(() => { if (!controller.signal.aborted) setFeedback({ type: 'error', message: 'Gagal memuat data inovasi untuk diedit.' }) })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingRecord(false) })
    return () => controller.abort()
  }, [innovationId, isEditMode])

  const updateField = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] ?? null : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const validateFieldOnBlur = (event) => {
    const { name, value } = event.target
    const validation = validateInnovation({ ...form, [name]: value })
    setErrors((current) => ({ ...current, [name]: validation[name] }))
  }

  const setFileField = (name, file) => {
    setForm((current) => ({ ...current, [name]: file ?? null }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const goToStep = (index, { preserveFeedback = false } = {}) => {
    if (index < 0 || index >= SECTIONS.length || index === stepIndex) return
    setStepIndex(index)
    // Error dan pesan belong to tahap asal. Tanpa pembersihan, tahap tanpa
    // field wajib ikut menampilkan "Lengkapi data wajib pada tahap ini".
    if (!preserveFeedback) {
      setFeedback(null)
      setErrors({})
    }
    requestAnimationFrame(() => {
      formMainRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' })
      requestAnimationFrame(() => {
        document.getElementById(`inovasi-step-title-${index}`)?.focus({ preventScroll: true })
      })
    })
  }

  const isFieldFilled = key => hasValue(form[key]) || Boolean(existingFiles[key + '_path'])
  const isSectionDone = fields => {
    const required = fields.filter(key => innovationRequiredFields.includes(key))
    return (required.length ? required : fields).every(isFieldFilled)
  }
  const completedRequiredCount = innovationRequiredFields.filter(isFieldFilled).length
  const progressPercent = Math.round((completedRequiredCount / innovationRequiredFields.length) * 100)

  const advanceStep = () => {
    const section = SECTIONS[stepIndex]
    const validation = validateInnovation(form)
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

  const startAnotherInnovation = () => {
    setForm(initialForm)
    setErrors({})
    setFeedback(null)
    setCompletion(null)
    setIsCustomInnovationType(false)
    setIsCustomGovernmentAffair(false)
    setStepIndex(0)
    formMainRef.current?.scrollIntoView({
      behavior: reducedMotion() ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  const viewInnovationResults = () => {
    window.history.pushState({}, '', '/inovasi/info')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const isGovernmentAffairCustom = isCustomGovernmentAffair || form.government_affair === OTHER_GOVERNMENT_AFFAIR || (
    form.government_affair && options.government_affairs.length > 0 &&
    !options.government_affairs.includes(form.government_affair)
  )
  const isInnovationTypeCustom = isCustomInnovationType || form.innovation_type === OTHER_INNOVATION_TYPE || (
    form.innovation_type && options.innovation_types.length > 0 &&
    !options.innovation_types.includes(form.innovation_type)
  )
  const labels = { title: 'Judul', innovator_name: 'Inovator', registration_number: 'Nomor Registrasi', reporting_year: 'Tahun Pelaporan', innovation_type: 'Bentuk Inovasi', government_affair: 'Urusan Pemerintahan Utama', regional_agency: 'Perangkat Daerah', trial_date: 'Tanggal Uji Coba', implementation_date: 'Tanggal Penerapan', ratification_date: 'Tanggal Pengembangan', profile_pdf: 'Profil', report_pdf: 'Laporan' }
  const reviewSections = SECTIONS.map(section => ({ title: section.title, entries: section.fields.map(key => [labels[key], form[key]?.name || form[key] || (existingFiles[key + '_path'] ? 'Berkas tersimpan' : '')]) }))

  const jumpToErrorStep = (fieldErrors) => {
    const firstName = Object.keys(fieldErrors)[0]
    const target = SECTIONS.findIndex(section => section.fields.includes(firstName))
    if (target >= 0 && target !== stepIndex) setStepIndex(target)
  }

  const requestReview = event => {
    event.preventDefault()
    const validation = validateInnovation(form)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setFeedback({ type: 'error', message: 'Periksa kembali bagian wajib dan berkas yang diunggah.' })
      jumpToErrorStep(validation)
      requestAnimationFrame(() => requestAnimationFrame(() => focusFirstError(validation)))
      return
    }
    setFeedback(null)
    setReviewOpen(true)
  }

  const submitForm = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setReviewOpen(false)
    setIsSaving(true)
    setErrors({})
    setFeedback(null)

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (['registration_number', 'regional_agency'].includes(key) || (value !== null && value !== '')) payload.append(key, value)
    })
    if (isEditMode) payload.append('_method', 'PUT')

    try {
      const response = isEditMode
        ? await api.post(`/innovations/${innovationId}`, payload)
        : await api.post('/innovations', payload)

      if (!isEditMode) {
        setCompletion({ message: response.data.message })
        setFeedback(null)
        formMainRef.current?.scrollIntoView({
          behavior: reducedMotion() ? 'instant' : 'smooth',
          block: 'start',
        })
      } else {
        setFeedback({ type: 'success', message: response.data.message })
        window.setTimeout(() => {
          window.location.href = '/inovasi/info'
        }, 800)
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        const fieldErrors = Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]]))
        setErrors(fieldErrors)
        jumpToErrorStep(fieldErrors)
        requestAnimationFrame(() => requestAnimationFrame(() => focusFirstError(fieldErrors)))
        setFeedback({ type: 'error', message: 'Periksa kembali data yang diisi.' })
      } else if (error.response?.status === 401) {
        setFeedback({ type: 'error', message: 'Sesi Anda berakhir. Silakan masuk kembali.' })
      } else if (error.response?.status === 403) {
        setFeedback({ type: 'error', message: 'Anda tidak memiliki izin mengubah data ini.' })
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
          <div className="access-gate-icon">
            <LockIcon size={26} aria-hidden="true" />
          </div>
          <p className="access-gate-kicker">Inovasi</p>
          <h1 className="access-gate-title">Masuk Terlebih Dahulu</h1>
          <p className="access-gate-desc">Input data inovasi hanya tersedia untuk pengguna yang sudah masuk. Silakan masuk untuk melanjutkan.</p>
          <a className="access-gate-button" href="/masuk">
            Masuk Sekarang
            <ArrowRightIcon size={16} aria-hidden="true" />
          </a>
        </div>
      </section>
    )
  }

  if (isLoadingRecord) {
    return (
      <section className="research-page">
        <div className="research-form-card">
          <div className="form-loading">Memuat data inovasi...</div>
        </div>
      </section>
    )
  }

  const activeSection = SECTIONS[stepIndex]
  const isLastStep = stepIndex === SECTIONS.length - 1

  return (
    <section className="inovasi-page research-page inovasi-wizard-page">
      <ServicePageHeader section="Inovasi" title={isEditMode ? 'Edit Inovasi' : 'Input Inovasi'} description="Catat gagasan dan perkembangan inovasi daerah Anda dalam empat tahap: Informasi Utama, Bentuk Inovasi, Timeline, dan Berkas Pendukung." />
      <div className="inovasi-wizard research-form-card" ref={formMainRef}>
        {completion ? (
          <div className="inovasi-completion form-feedback success" role="status">
            <h2>Inovasi berhasil disimpan</h2>
            <p>{completion.message}</p>
            <p>Apa yang ingin Anda lakukan selanjutnya?</p>
            <div className="inovasi-completion-actions">
              <button className="secondary-form-button" type="button" onClick={startAnotherInnovation}>Input Inovasi Lagi</button>
              <button className="primary-form-button" type="button" onClick={viewInnovationResults}>Lihat Hasil Inovasi</button>
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
              <p className="wiz-progress-note">Tahap {stepIndex + 1} dari {SECTIONS.length} — {completedRequiredCount} dari {innovationRequiredFields.length} data wajib terisi</p>
            </nav>

            {feedback && <div className={`form-feedback wiz-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

            <form onSubmit={requestReview} noValidate>
              <section className="wiz-panel" key={activeSection.id} aria-labelledby={`inovasi-step-title-${stepIndex}`}>
                <div className="wiz-panel-head">
                  <h2 id={`inovasi-step-title-${stepIndex}`} tabIndex={-1}>{activeSection.title}</h2>
                  <p>{activeSection.desc}</p>
                </div>

                {stepIndex === 0 && (
                  <div className="inovasi-grid2">
                    <label className="inovasi-field"><span className="field-label">Judul<FieldRequirement required={true} /></span>
                      <div className="inovasi-input-wrap">
                        <IconTitle className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input aria-required="true" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'innovation-title-error' : undefined} name="title" value={form.title} onBlur={validateFieldOnBlur} onChange={updateField} placeholder="Judul inovasi" />
                      </div>
                      {errors.title && <small id="innovation-title-error" className="field-error">{errors.title}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Inovator<FieldRequirement required={true} /></span>
                      <div className="inovasi-input-wrap">
                        <IconUser className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input aria-required="true" aria-invalid={Boolean(errors.innovator_name)} aria-describedby={errors.innovator_name ? 'innovation-innovator-error' : undefined} name="innovator_name" value={form.innovator_name} onBlur={validateFieldOnBlur} onChange={updateField} placeholder="Nama inovator" />
                      </div>
                      {errors.innovator_name && <small id="innovation-innovator-error" className="field-error">{errors.innovator_name}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Nomor Registrasi<FieldRequirement required={false} /></span>
                      <div className="inovasi-input-wrap">
                        <Hash className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="text" name="registration_number" value={form.registration_number} onBlur={validateFieldOnBlur} onChange={updateField} maxLength={255} placeholder="Nomor registrasi (opsional)" />
                      </div>
                      {errors.registration_number && <small className="field-error">{errors.registration_number}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Tahun Pelaporan<FieldRequirement required={true} /></span>
                      <div className="inovasi-input-wrap">
                        <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="number" aria-required="true" aria-invalid={Boolean(errors.reporting_year)} aria-describedby={errors.reporting_year ? 'innovation-year-error' : undefined} name="reporting_year" value={form.reporting_year} onBlur={validateFieldOnBlur} onChange={updateField} min="2000" max="2100" />
                      </div>
                      {errors.reporting_year && <small id="innovation-year-error" className="field-error">{errors.reporting_year}</small>}
                    </label>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="inovasi-grid2">
                    <label className="inovasi-field"><span className="field-label">Bentuk Inovasi Daerah<FieldRequirement required={true} /></span>
                      <div className="inovasi-input-wrap">
                        <IconLayers className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        {isInnovationTypeCustom ? (
                          <>
                            <input type="text" aria-required="true" aria-invalid={Boolean(errors.innovation_type)} name="innovation_type" value={form.innovation_type === OTHER_INNOVATION_TYPE ? '' : form.innovation_type} onBlur={validateFieldOnBlur} onChange={updateField} maxLength={255} placeholder="Bentuk Inovasi Daerah Lainnya" />
                            <button className="inovasi-chevron-button" type="button" aria-label="Pilih bentuk inovasi dari daftar" onClick={() => {
                              setIsCustomInnovationType(false)
                              setForm((current) => ({ ...current, innovation_type: '' }))
                              setErrors((current) => ({ ...current, innovation_type: undefined }))
                            }}>
                              <IconChevron aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <>
                            <select aria-required="true" aria-invalid={Boolean(errors.innovation_type)} name="innovation_type" value={form.innovation_type} onBlur={validateFieldOnBlur} onChange={(event) => {
                              if (event.target.value === OTHER_INNOVATION_TYPE) {
                                setIsCustomInnovationType(true)
                                setForm((current) => ({ ...current, innovation_type: '' }))
                              } else {
                                setIsCustomInnovationType(false)
                                updateField(event)
                              }
                            }}>
                              <option value="">Pilih Bentuk Inovasi</option>
                              {options.innovation_types.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            <IconChevron className="inovasi-chevron" aria-hidden="true" />
                          </>
                        )}
                      </div>
                      {errors.innovation_type && <small className="field-error">{errors.innovation_type}</small>}
                    </label>


                    <label className="inovasi-field"><span className="field-label">Urusan Pemerintahan Utama<FieldRequirement required={true} /></span>
                      <div className="inovasi-input-wrap">
                        <IconBuilding className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        {isGovernmentAffairCustom ? (
                          <>
                            <input type="text" aria-required="true" aria-invalid={Boolean(errors.government_affair)} name="government_affair" value={form.government_affair === OTHER_GOVERNMENT_AFFAIR ? '' : form.government_affair} onBlur={validateFieldOnBlur} onChange={updateField} maxLength={255} placeholder="Urusan Pemerintahan Lainnya" />
                            <button className="inovasi-chevron-button" type="button" aria-label="Pilih urusan dari daftar" onClick={() => {
                              setIsCustomGovernmentAffair(false)
                              setForm((current) => ({ ...current, government_affair: '' }))
                              setErrors((current) => ({ ...current, government_affair: undefined }))
                            }}>
                              <IconChevron aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <>
                            <select aria-required="true" aria-invalid={Boolean(errors.government_affair)} name="government_affair" value={form.government_affair} onBlur={validateFieldOnBlur} onChange={(event) => {
                              if (event.target.value === OTHER_GOVERNMENT_AFFAIR) {
                                setIsCustomGovernmentAffair(true)
                                setForm((current) => ({ ...current, government_affair: '' }))
                              } else {
                                setIsCustomGovernmentAffair(false)
                                updateField(event)
                              }
                            }}>
                              <option value="">Pilih urusan pemerintahan</option>
                              {options.government_affairs.map((affair) => (
                                <option key={affair} value={affair}>{affair}</option>
                              ))}
                            </select>
                            <IconChevron className="inovasi-chevron" aria-hidden="true" />
                          </>
                        )}
                      </div>
                      {errors.government_affair && <small className="field-error">{errors.government_affair}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Perangkat Daerah<FieldRequirement required={false} /></span>
                      <div className="inovasi-input-wrap">
                        <Building2 className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="text" name="regional_agency" value={form.regional_agency} onBlur={validateFieldOnBlur} onChange={updateField} maxLength={255} placeholder="Nama perangkat daerah (opsional)" />
                      </div>
                      {errors.regional_agency && <small className="field-error">{errors.regional_agency}</small>}
                    </label>
                  </div>
                )}


                {stepIndex === 3 && (
                  <div className="inovasi-grid2">
                    <div className="inovasi-field">
                      <span className="wiz-file-label"><IconFile size={15} aria-hidden="true" /> File Profil (PDF)<FieldRequirement required={false} /></span>
                      <PdfUploadField name="profile_pdf" inputId="innovation-profile-pdf" label="File Profil" file={form.profile_pdf} onChange={file => setFileField('profile_pdf', file)} error={errors.profile_pdf} existingHref={existingFiles.profile_pdf_path ? innovationPdfUrl(innovationId, 'profile') : undefined} existingName={existingFiles.profile_pdf_original_name || 'File Profil.pdf'} />
                    </div>

                    <div className="inovasi-field">
                      <span className="wiz-file-label"><IconFile size={15} aria-hidden="true" /> File Laporan Pelaksanaan (PDF)<FieldRequirement required={false} /></span>
                      <PdfUploadField name="report_pdf" inputId="innovation-report-pdf" label="File Laporan Pelaksanaan" file={form.report_pdf} onChange={file => setFileField('report_pdf', file)} error={errors.report_pdf} existingHref={existingFiles.report_pdf_path ? innovationPdfUrl(innovationId, 'report') : undefined} existingName={existingFiles.report_pdf_original_name || 'File Laporan Pelaksanaan.pdf'} />
                    </div>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className="inovasi-grid2 wiz-timeline">
                    <label className="inovasi-field"><span className="field-label">Tanggal Uji Coba<FieldRequirement required={false} /></span>
                      <div className="inovasi-input-wrap">
                        <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="date" name="trial_date" value={form.trial_date} onChange={updateField} />
                      </div>
                      {errors.trial_date && <small className="field-error">{errors.trial_date}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Tanggal Penerapan<FieldRequirement required={false} /></span>
                      <div className="inovasi-input-wrap">
                        <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="date" name="implementation_date" value={form.implementation_date} onChange={updateField} />
                      </div>
                      {errors.implementation_date && <small className="field-error">{errors.implementation_date}</small>}
                    </label>

                    <label className="inovasi-field"><span className="field-label">Tanggal Pengembangan<FieldRequirement required={false} /></span>
                      <div className="inovasi-input-wrap">
                        <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                        <input type="date" name="ratification_date" value={form.ratification_date} onChange={updateField} />
                      </div>
                      {errors.ratification_date && <small className="field-error">{errors.ratification_date}</small>}
                    </label>
                  </div>
                )}

                <div className="wiz-footer">
                  {stepIndex > 0 ? (
                    <button className="secondary-form-button wiz-back" type="button" onClick={() => goToStep(stepIndex - 1)} disabled={isSaving}>
                      <ArrowLeftIcon size={16} aria-hidden="true" /> Kembali
                    </button>
                  ) : <span className="wiz-footer-spacer" aria-hidden="true" />}
                  {isLastStep ? (
                    <button className="primary-form-button wiz-next" type="submit" disabled={isSaving}>
                      {isSaving ? 'Menyimpan...' : <>Tinjau Inovasi <ArrowRightIcon size={16} aria-hidden="true" /></>}
                    </button>
                  ) : (
                    <button className="primary-form-button wiz-next" type="button" onClick={advanceStep}>
                      Lanjutkan <ArrowRightIcon size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </section>
            </form>
          </>
        )}
      </div>
      {reviewOpen && <SubmissionReview title="Ringkasan Inovasi" sections={reviewSections} onClose={() => setReviewOpen(false)} onConfirm={submitForm} busy={isSaving} confirmLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Inovasi'} />}
    </section>
  )
}

export default function InovasiInputPage({ innovationId }) {
  return <InnovationForm key={innovationId || 'new'} innovationId={innovationId} />
}

