import { useEffect, useRef, useState } from 'react'
import { Hash, CalendarDays, Building2, AlignLeft as IconTitle, UserRound as IconUser, Layers as IconLayers, Building as IconBuilding, Calendar as IconCalendar, ChevronDown as IconChevron, Check as IconCheck, FileText as IconFile, LockKeyhole as LockIcon, ArrowRight as ArrowRightIcon } from 'lucide-react'
import ServicePageHeader from '../components/ServicePageHeader'
import FormProgress from '../components/FormProgress'
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
  innovation_type: '',
  government_affair: '',
  regional_agency: '',
  trial_date: '',
  implementation_date: '',
  ratification_date: '',
  profile_pdf: null,
  report_pdf: null,
  reporting_year: new Date().getFullYear(),
}

const SECTIONS = [
  { id: 'info', title: 'Informasi Utama', desc: 'Identitas & pelaporan', fields: ['title', 'innovator_name', 'registration_number', 'reporting_year'] },
  { id: 'klasifikasi', title: 'Bentuk Inovasi', desc: 'Bentuk, urusan & perangkat daerah', fields: ['innovation_type', 'government_affair', 'regional_agency'] },
  { id: 'timeline', title: 'Timeline', desc: 'Tanggal kegiatan', fields: ['trial_date', 'implementation_date', 'ratification_date'] },
  { id: 'berkas', title: 'Berkas', desc: 'Dokumen pendukung', fields: ['profile_pdf', 'report_pdf'] },
]


function InnovationForm({ innovationId }) {
  const isEditMode = Boolean(innovationId)
  const [form, setForm] = useState(initialForm)
  const [options, setOptions] = useState({ innovation_types: [], government_affairs: [] })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode)
  const [isCustomInnovationType, setIsCustomInnovationType] = useState(false)
  const [isCustomGovernmentAffair, setIsCustomGovernmentAffair] = useState(false)
  const [existingFiles, setExistingFiles] = useState({ profile_pdf_path: null, report_pdf_path: null })
  const [reviewOpen, setReviewOpen] = useState(false)
  const savingRef = useRef(false)
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  const { isAuthenticated } = useAuth()
  const sectionRefs = useRef({})

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
          innovation_type: data.innovation_type ?? '',
          government_affair: data.government_affair ?? '',
          regional_agency: data.regional_agency ?? '',
          trial_date: data.trial_date ? data.trial_date.slice(0, 10) : '',
          implementation_date: data.implementation_date ? data.implementation_date.slice(0, 10) : '',
          ratification_date: data.ratification_date ? data.ratification_date.slice(0, 10) : '',
          profile_pdf: null,
          report_pdf: null,
          reporting_year: data.reporting_year ?? new Date().getFullYear(),
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.dataset.sectionId)
        })
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [isLoadingRecord, isAuthenticated])

  const updateField = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] ?? null : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const setFileField = (name, file) => {
    setForm((current) => ({ ...current, [name]: file ?? null }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }

  const isFieldFilled = key => hasValue(form[key]) || Boolean(existingFiles[key + '_path'])
  const isSectionDone = fields => {
    const required = fields.filter(key => innovationRequiredFields.includes(key))
    return (required.length ? required : fields).every(isFieldFilled)
  }
  const progressPercent = Math.round(innovationRequiredFields.filter(isFieldFilled).length / innovationRequiredFields.length * 100)
  const completeness = SECTIONS.map(section => ({ title: section.title, done: isSectionDone(section.fields), optional: !section.fields.some(key => innovationRequiredFields.includes(key)) }))
  const isGovernmentAffairCustom = isCustomGovernmentAffair || (
    form.government_affair && options.government_affairs.length > 0 &&
    !options.government_affairs.includes(form.government_affair)
  )
  const isInnovationTypeCustom = isCustomInnovationType || form.innovation_type === OTHER_INNOVATION_TYPE || (
    form.innovation_type && options.innovation_types.length > 0 &&
    !options.innovation_types.includes(form.innovation_type)
  )
  const labels = { title: 'Judul', innovator_name: 'Inovator', registration_number: 'Nomor Registrasi', reporting_year: 'Tahun Pelaporan', innovation_type: 'Bentuk Inovasi', government_affair: 'Urusan Pemerintahan Utama', regional_agency: 'Perangkat Daerah', trial_date: 'Uji Coba', implementation_date: 'Penerapan', ratification_date: 'Pengembangan', profile_pdf: 'Profil', report_pdf: 'Laporan' }
  const reviewSections = SECTIONS.map(section => ({ title: section.title, entries: section.fields.map(key => [labels[key], form[key]?.name || form[key] || (existingFiles[key + '_path'] ? 'Berkas tersimpan' : '')]) }))
  const requestReview = event => {
    event.preventDefault()
    const validation = validateInnovation(form)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setFeedback({ type: 'error', message: 'Periksa kembali bagian wajib dan berkas yang diunggah.' })
      focusFirstError(validation)
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

      setFeedback({ type: 'success', message: response.data.message })

      if (!isEditMode) {
        setForm(initialForm)
        const profileInput = document.getElementById('innovation-profile-pdf')
        const reportInput = document.getElementById('innovation-report-pdf')
        if (profileInput) profileInput.value = ''
        if (reportInput) reportInput.value = ''
      } else {
        window.setTimeout(() => {
          window.location.href = '/inovasi/info'
        }, 800)
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        const fieldErrors = Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]]))
        setErrors(fieldErrors)
        focusFirstError(fieldErrors)
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

  return (
    <section className="inovasi-page research-page">
      <ServicePageHeader section="Inovasi" title={isEditMode ? 'Edit Inovasi' : 'Input Inovasi'} description="Catat gagasan dan perkembangan inovasi daerah Anda." />
      <div className="inovasi-layout">
        <nav className="inovasi-steps">
          {SECTIONS.map((section, index) => {
            const done = isSectionDone(section.fields)
            const isActive = activeSection === section.id
            return (
              <button
                type="button"
                key={section.id}
                className={`inovasi-step ${isActive ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="inovasi-step-badge">{done ? <IconCheck size={16} aria-hidden="true" /> : index + 1}</span>
                <span className="inovasi-step-text">
                  <span className="inovasi-step-title">{section.title}</span>
                  <span className="inovasi-step-desc">{section.desc}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="inovasi-form-main">
          <FormProgress sections={completeness} />
        <div className="inovasi-form-card research-form-card">
          {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

          <form onSubmit={requestReview} noValidate>

            <div className="inovasi-section" data-section-id="info" ref={(el) => (sectionRefs.current.info = el)}>
              <div className="inovasi-section-head">
                <div className="inovasi-section-num">1</div>
                <div>
                  <h3>Informasi Utama</h3>
                 
                </div>
              </div>
              <div className="inovasi-grid2">
                <label className="inovasi-field"><span className="field-label">Judul<FieldRequirement required={true} /></span>
                  <div className="inovasi-input-wrap">
                    <IconTitle className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input aria-required="true" aria-invalid={Boolean(errors.title)} name="title" value={form.title} onChange={updateField} placeholder="Judul inovasi" />
                  </div>
                  {errors.title && <small className="field-error">{errors.title}</small>}
                </label>

                <label className="inovasi-field"><span className="field-label">Inovator<FieldRequirement required={true} /></span>
                  <div className="inovasi-input-wrap">
                    <IconUser className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input aria-required="true" aria-invalid={Boolean(errors.innovator_name)} name="innovator_name" value={form.innovator_name} onChange={updateField} placeholder="Nama inovator" />
                  </div>
                  {errors.innovator_name && <small className="field-error">{errors.innovator_name}</small>}
                </label>

                <label className="inovasi-field"><span className="field-label">Nomor Registrasi<FieldRequirement required={false} /></span>
                  <div className="inovasi-input-wrap">
                    <Hash className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="text" name="registration_number" value={form.registration_number} onChange={updateField} maxLength={255} placeholder="Nomor registrasi (opsional)" />
                  </div>
                  {errors.registration_number && <small className="field-error">{errors.registration_number}</small>}
                </label>

                <label className="inovasi-field"><span className="field-label">Tahun Pelaporan<FieldRequirement required={true} /></span>
                  <div className="inovasi-input-wrap">
                    <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="number" aria-required="true" aria-invalid={Boolean(errors.reporting_year)} name="reporting_year" value={form.reporting_year} onChange={updateField} min="2000" max="2100" />
                  </div>
                  {errors.reporting_year && <small className="field-error">{errors.reporting_year}</small>}
                </label>
              </div>
            </div>

            <div className="inovasi-section" data-section-id="klasifikasi" ref={(el) => (sectionRefs.current.klasifikasi = el)}>
              <div className="inovasi-section-head">
                <div className="inovasi-section-num">2</div>
                <div>
                  <h3>Bentuk Inovasi</h3>
                
                </div>
              </div>
              <div className="inovasi-grid2">
                <label className="inovasi-field"><span className="field-label">Bentuk Inovasi Daerah<FieldRequirement required={true} /></span>
                  <div className="inovasi-input-wrap">
                    <IconLayers className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    {isInnovationTypeCustom ? (
                      <>
                        <input type="text" aria-required="true" aria-invalid={Boolean(errors.innovation_type)} name="innovation_type" value={form.innovation_type === OTHER_INNOVATION_TYPE ? '' : form.innovation_type} onChange={updateField} maxLength={255} placeholder="Bentuk Inovasi Daerah Lainnya" />
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
                        <select aria-required="true" aria-invalid={Boolean(errors.innovation_type)} name="innovation_type" value={form.innovation_type} onChange={(event) => {
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
                        <input type="text" aria-required="true" aria-invalid={Boolean(errors.government_affair)} name="government_affair" value={form.government_affair === OTHER_GOVERNMENT_AFFAIR ? '' : form.government_affair} onChange={updateField} maxLength={255} placeholder="Urusan Pemerintahan Lainnya" />
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
                        <select aria-required="true" aria-invalid={Boolean(errors.government_affair)} name="government_affair" value={form.government_affair} onChange={(event) => {
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
                    <input type="text" name="regional_agency" value={form.regional_agency} onChange={updateField} maxLength={255} placeholder="Nama perangkat daerah (opsional)" />
                  </div>
                  {errors.regional_agency && <small className="field-error">{errors.regional_agency}</small>}
                </label>
              </div>
            </div>

            <div className="inovasi-section" data-section-id="timeline" ref={(el) => (sectionRefs.current.timeline = el)}>
              <div className="inovasi-section-head">
                <div className="inovasi-section-num">3</div>
                <div>
                  <h3>Timeline</h3>
                 
                </div>
              </div>

              <div className="inovasi-timeline">
                <div
                  className="inovasi-tl-dot"
                  style={form.trial_date ? { background: 'var(--yellow)', borderColor: 'var(--yellow)' } : undefined}
                >
                  <em>Uji Coba</em>
                </div>
                <div
                  className="inovasi-tl-line"
                  style={form.trial_date ? { background: 'var(--yellow)' } : undefined}
                />
                <div
                  className="inovasi-tl-dot"
                  style={form.implementation_date ? { background: 'var(--yellow)', borderColor: 'var(--yellow)' } : undefined}
                >
                  <em>Penerapan</em>
                </div>
                <div
                  className="inovasi-tl-line"
                  style={form.implementation_date ? { background: 'var(--yellow)' } : undefined}
                />
                <div
                  className="inovasi-tl-dot"
                  style={form.ratification_date ? { background: 'var(--yellow)', borderColor: 'var(--yellow)' } : undefined}
                >
                  <em>Pengembangan</em>
                </div>
              </div>

              <div className="inovasi-grid2">
                <label className="inovasi-field"><span className="field-label">Tanggal Uji Coba<FieldRequirement required={false} /></span>
                  <div className="inovasi-input-wrap">
                    <IconCalendar className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="date" name="trial_date" value={form.trial_date} onChange={updateField} />
                  </div>
                  {errors.trial_date && <small className="field-error">{errors.trial_date}</small>}
                </label>

                <label className="inovasi-field"><span className="field-label">Tanggal Penerapan<FieldRequirement required={false} /></span>
                  <div className="inovasi-input-wrap">
                    <IconCalendar className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="date" name="implementation_date" value={form.implementation_date} onChange={updateField} />
                  </div>
                  {errors.implementation_date && <small className="field-error">{errors.implementation_date}</small>}
                </label>

                <label className="inovasi-field"><span className="field-label">Tanggal Pengembangan<FieldRequirement required={false} /></span>
                  <div className="inovasi-input-wrap">
                    <IconCalendar className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="date" name="ratification_date" value={form.ratification_date} onChange={updateField} />
                  </div>
                  {errors.ratification_date && <small className="field-error">{errors.ratification_date}</small>}
                </label>

              </div>
            </div>

            <div className="inovasi-section" data-section-id="berkas" ref={(el) => (sectionRefs.current.berkas = el)}>
              <div className="inovasi-section-head">
                <div className="inovasi-section-num">4</div>
                <div>
                  <h3>Berkas Pendukung</h3>
              
                </div>
              </div>
              <div className="inovasi-grid2">
                <div className="inovasi-field">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconFile size={16} aria-hidden="true" /> File Profil (PDF)<FieldRequirement required={false} /></span>
                  <PdfUploadField name="profile_pdf" inputId="innovation-profile-pdf" label="File Profil" file={form.profile_pdf} onChange={file => setFileField('profile_pdf', file)} error={errors.profile_pdf} existingHref={existingFiles.profile_pdf_path ? innovationPdfUrl(innovationId, 'profile') : undefined} existingName={existingFiles.profile_pdf_original_name || "File Profil.pdf"} />
                </div>

                <div className="inovasi-field">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconFile size={16} aria-hidden="true" /> File Laporan Pelaksanaan (PDF)<FieldRequirement required={false} /></span>
                  <PdfUploadField name="report_pdf" inputId="innovation-report-pdf" label="File Laporan Pelaksanaan" file={form.report_pdf} onChange={file => setFileField('report_pdf', file)} error={errors.report_pdf} existingHref={existingFiles.report_pdf_path ? innovationPdfUrl(innovationId, 'report') : undefined} existingName={existingFiles.report_pdf_original_name || "File Laporan Pelaksanaan.pdf"} />
                </div>
              </div>
            </div>

            <div className="inovasi-footer-bar">
              <div>
                <div className="inovasi-progress-text">{progressPercent}% bagian wajib terisi</div>
                <div className="inovasi-progress-track">
                  <div className="inovasi-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-form-link" type="submit" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Tinjau Inovasi'}
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
      {reviewOpen && <SubmissionReview title="Ringkasan Inovasi" sections={reviewSections} onClose={() => setReviewOpen(false)} onConfirm={submitForm} busy={isSaving} confirmLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Inovasi'} />}
    </section>
  )
}

export default function InovasiInputPage({ innovationId }) {
  return <InnovationForm key={innovationId || 'new'} innovationId={innovationId} />
}
