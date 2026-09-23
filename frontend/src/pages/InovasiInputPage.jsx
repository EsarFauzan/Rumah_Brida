import { useEffect, useRef, useState } from 'react'
import { Hash, CalendarDays, Building2 } from 'lucide-react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

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

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields)
const CURRENT_YEAR = new Date().getFullYear()

function InovasiInputPage({ innovationId }) {
  const isEditMode = Boolean(innovationId)
  const [form, setForm] = useState(initialForm)
  const [options, setOptions] = useState({ innovation_types: [], government_affairs: [] })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode)
  const [existingFiles, setExistingFiles] = useState({ profile_pdf_path: null, report_pdf_path: null })
  const [dragOver, setDragOver] = useState({ profile_pdf: false, report_pdf: false })
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

    setIsLoadingRecord(true)
    api.get(`/innovations/${innovationId}`)
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
        })
      })
      .catch(() => setFeedback({ type: 'error', message: 'Gagal memuat data inovasi untuk diedit.' }))
      .finally(() => setIsLoadingRecord(false))
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

  const handleDrop = (name) => (event) => {
    event.preventDefault()
    setDragOver((current) => ({ ...current, [name]: false }))
    const file = event.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') {
      setFileField(name, file)
      const input = document.getElementById(name === 'profile_pdf' ? 'innovation-profile-pdf' : 'innovation-report-pdf')
      if (input) {
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
      }
    }
  }

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isFieldFilled = (f) => form[f] !== '' && form[f] !== null && form[f] !== undefined

  const isSectionDone = (fields) => fields.every(isFieldFilled)

  const filledCount = ALL_FIELDS.filter(isFieldFilled).length
  const progressPercent = Math.round((filledCount / ALL_FIELDS.length) * 100)
  const ringCircumference = 2 * Math.PI * 24
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference

  const submitForm = async (event) => {
    event.preventDefault()
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
        setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]])))
        setFeedback({ type: 'error', message: 'Periksa kembali data yang diisi.' })
      } else if (error.response?.status === 401) {
        setFeedback({ type: 'error', message: 'Sesi Anda berakhir. Silakan masuk kembali.' })
      } else if (error.response?.status === 403) {
        setFeedback({ type: 'error', message: 'Anda tidak memiliki izin mengubah data ini.' })
      } else {
        setFeedback({ type: 'error', message: 'Tidak dapat terhubung ke server. Pastikan backend Laravel sedang berjalan.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const IconTitle = () => (
    <svg className="inovasi-icon" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  )
  const IconUser = () => (
    <svg className="inovasi-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  )
  const IconLayers = () => (
    <svg className="inovasi-icon" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
  const IconBuilding = () => (
    <svg className="inovasi-icon" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8 8h1.5M8 12h1.5M8 16h1.5M14.5 8H16M14.5 12H16M14.5 16H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  )
  const IconCalendar = () => (
    <svg className="inovasi-icon" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  )
  const IconChevron = () => (
    <svg className="inovasi-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
  const IconUpload = () => (
    <svg className="inovasi-upicon" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

    const LockIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1.4" fill="currentColor" /></svg>
  )
  const ArrowRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
  const FileDropZone = ({ name, inputId, existingPath }) => {
    const file = form[name]
    const isOver = dragOver[name]

    if (file) {
      return (
        <div className="inovasi-file-chip">
          <span className="inovasi-fi"><IconCheck /></span>
          <span className="inovasi-fname">{file.name}</span>
          <span className="inovasi-rm" role="button" tabIndex={0} onClick={() => { setFileField(name, null); document.getElementById(inputId).value = '' }}>
            <IconX />
          </span>
        </div>
      )
    }

    return (
      <>
        <label className={`inovasi-drop ${isOver ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver((c) => ({ ...c, [name]: true })) }}
          onDragLeave={() => setDragOver((c) => ({ ...c, [name]: false }))}
          onDrop={handleDrop(name)}
        >
          <IconUpload />
          <p>Klik atau seret file PDF ke sini</p>
          <small>Format PDF, ukuran sesuai ketentuan server</small>
          <input id={inputId} type="file" name={name} accept="application/pdf" onChange={updateField} />
        </label>
        {isEditMode && existingPath && (
          <small style={{ display: 'block', marginTop: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
            File saat ini: <a href={`/storage/${existingPath}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', fontWeight: 600 }}>Lihat PDF</a> — kosongkan jika tidak ingin mengganti
          </small>
        )}
        {errors[name] && <small className="field-error" style={{ display: 'block', marginTop: 6 }}>{errors[name]}</small>}
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="access-gate-page">
        <div className="access-gate-card">
          <div className="access-gate-icon">
            <LockIcon />
          </div>
          <p className="access-gate-kicker">Inovasi</p>
          <h1 className="access-gate-title">Masuk Terlebih Dahulu</h1>
          <p className="access-gate-desc">Input data inovasi hanya tersedia untuk pengguna yang sudah masuk. Silakan masuk untuk melanjutkan.</p>
          <a className="access-gate-button" href="/masuk">
            Masuk Sekarang
            <ArrowRightIcon />
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
      <div className="inovasi-hero">
        <div className="inovasi-hero-inner">
          <div>
            <div className="inovasi-crumb">
              Inovasi <span className="inovasi-crumb-dot" /> <b>{isEditMode ? 'Edit Inovasi' : 'Input Inovasi'}</b>
            </div>
            <h1>{isEditMode ? 'Edit Inovasi' : 'Input Inovasi'}</h1>
            <p>Lengkapi data inovasi daerah dengan informasi yang akurat dan berkas pendukung yang sesuai.</p>
          </div>
          <div className="inovasi-ring-wrap">
            <svg className="inovasi-ring" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,.22)" strokeWidth="5" fill="none" />
              <circle
                className="inovasi-ring-fill"
                cx="28" cy="28" r="24" strokeWidth="5" fill="none"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 300ms ease' }}
              />
            </svg>
            <div>
              <div className="inovasi-ring-value">{progressPercent}%</div>
              <div className="inovasi-ring-label">Lengkap</div>
            </div>
          </div>
        </div>
      </div>

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
                <span className="inovasi-step-badge">{done ? <IconCheck /> : index + 1}</span>
                <span className="inovasi-step-text">
                  <span className="inovasi-step-title">{section.title}</span>
                  <span className="inovasi-step-desc">{section.desc}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="inovasi-form-card research-form-card">
          {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

          <form onSubmit={submitForm} noValidate>

            <div className="inovasi-section" data-section-id="info" ref={(el) => (sectionRefs.current.info = el)}>
              <div className="inovasi-section-head">
                <div className="inovasi-section-num">1</div>
                <div>
                  <h3>Informasi Utama</h3>
                 
                </div>
              </div>
              <div className="inovasi-grid2">
                <label className="inovasi-field">Judul
                  <div className="inovasi-input-wrap">
                    <IconTitle />
                    <input name="title" value={form.title} onChange={updateField} placeholder="Judul inovasi" />
                  </div>
                  {errors.title && <small className="field-error">{errors.title}</small>}
                </label>

                <label className="inovasi-field">Inovator
                  <div className="inovasi-input-wrap">
                    <IconUser />
                    <input name="innovator_name" value={form.innovator_name} onChange={updateField} placeholder="Nama inovator" />
                  </div>
                  {errors.innovator_name && <small className="field-error">{errors.innovator_name}</small>}
                </label>

                <label className="inovasi-field">Nomor Registrasi
                  <div className="inovasi-input-wrap">
                    <Hash className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="text" name="registration_number" value={form.registration_number} onChange={updateField} maxLength={255} placeholder="Nomor registrasi (opsional)" />
                  </div>
                  {errors.registration_number && <small className="field-error">{errors.registration_number}</small>}
                </label>

                <label className="inovasi-field">Tahun Pelaporan
                  <div className="inovasi-input-wrap">
                    <CalendarDays className="inovasi-icon" strokeWidth={1.8} aria-hidden="true" />
                    <input type="number" name="reporting_year" value={form.reporting_year} onChange={updateField} min="2000" max="2100" />
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
                <label className="inovasi-field">Bentuk Inovasi Daerah
                  <div className="inovasi-input-wrap">
                    <IconLayers />
                    <select name="innovation_type" value={form.innovation_type} onChange={updateField}>
                      <option value="">Pilih Bentuk Inovasi</option>
                      {options.innovation_types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <IconChevron />
                  </div>
                  {errors.innovation_type && <small className="field-error">{errors.innovation_type}</small>}
                </label>

                <label className="inovasi-field">Urusan Pemerintahan Utama
                  <div className="inovasi-input-wrap">
                    <IconBuilding />
                    <select name="government_affair" value={form.government_affair} onChange={updateField}>
                      <option value="">Pilih urusan pemerintahan</option>
                      {options.government_affairs.map((affair) => (
                        <option key={affair} value={affair}>{affair}</option>
                      ))}
                    </select>
                    <IconChevron />
                  </div>
                  {errors.government_affair && <small className="field-error">{errors.government_affair}</small>}
                </label>

                <label className="inovasi-field">Perangkat Daerah
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
                <label className="inovasi-field">Tanggal Uji Coba
                  <div className="inovasi-input-wrap">
                    <IconCalendar />
                    <input type="date" name="trial_date" value={form.trial_date} onChange={updateField} />
                  </div>
                  {errors.trial_date && <small className="field-error">{errors.trial_date}</small>}
                </label>

                <label className="inovasi-field">Tanggal Penerapan
                  <div className="inovasi-input-wrap">
                    <IconCalendar />
                    <input type="date" name="implementation_date" value={form.implementation_date} onChange={updateField} />
                  </div>
                  {errors.implementation_date && <small className="field-error">{errors.implementation_date}</small>}
                </label>

                <label className="inovasi-field">Tanggal Pengembangan
                  <div className="inovasi-input-wrap">
                    <IconCalendar />
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconFile /> File Profil (PDF)</span>
                  <FileDropZone name="profile_pdf" inputId="innovation-profile-pdf" existingPath={existingFiles.profile_pdf_path} />
                </div>

                <div className="inovasi-field">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconFile /> File Laporan Pelaksanaan (PDF)</span>
                  <FileDropZone name="report_pdf" inputId="innovation-report-pdf" existingPath={existingFiles.report_pdf_path} />
                </div>
              </div>
            </div>

            <div className="inovasi-footer-bar">
              <div>
                <div className="inovasi-progress-text">{progressPercent}% formulir terisi</div>
                <div className="inovasi-progress-track">
                  <div className="inovasi-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-form-link" type="submit" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Inovasi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default InovasiInputPage
