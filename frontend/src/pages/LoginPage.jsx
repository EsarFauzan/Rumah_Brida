import { useState } from 'react'
import api from '../services/api'
import { setSession } from '../services/authStore'
import useAuth from '../hooks/useAuth'
import logoRumahBrida from '../assets/image/logo-fix.webp'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

const navigateTo = (path) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const MailIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const LockIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1.3" fill="currentColor" /></svg>
)
const UserIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
)
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.5 13.5 0 0 1-3.1 4M6.6 6.6C3.6 8.5 1.5 12 1.5 12S5 19 12 19a10.7 10.7 0 0 0 4-.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const CheckBadge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

const highlights = [
  'Ajukan dan pantau proposal riset daerah',
  'Daftarkan inovasi dan unggah berkas pendukung',
  'Akses info publik dan layanan BRIDA kapan saja',
]

function LoginPage({ redirectTo = '/riset/hasil' }) {
  const { isAuthenticated, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const isRegister = mode === 'register'

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setForm(emptyForm)
    setErrors({})
    setFeedback(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setErrors({})
    setFeedback(null)

    const endpoint = isRegister ? '/auth/register' : '/auth/login'
    const payload = isRegister
      ? form
      : { email: form.email, password: form.password }

    try {
      const response = await api.post(endpoint, payload)
      const { token, user: authUser } = response.data.data
      setSession(token, authUser)
      setFeedback({ type: 'success', message: response.data.message })
      window.setTimeout(() => navigateTo(redirectTo), 600)
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]])))
        setFeedback({ type: 'error', message: 'Periksa kembali data yang diisi.' })
      } else if (error.response?.status === 429) {
        setFeedback({ type: 'error', message: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' })
      } else {
        setFeedback({ type: 'error', message: 'Tidak dapat terhubung ke server. Pastikan backend Laravel sedang berjalan.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isAuthenticated) {
    return (
      <section className="research-page auth-page">
        <div className="research-form-card">
          <header className="research-form-header">
            <p>Akun</p>
            <h1>Anda sudah masuk</h1>
          </header>
          <div className="form-feedback success" role="status">
            Masuk sebagai {user?.name ?? user?.email ?? 'pengguna terverifikasi'}.
          </div>
          <div className="form-actions">
            <a className="secondary-form-link" href="/riset/hasil">Hasil Riset</a>
            <a className="primary-form-link" href="/riset/proposal">Ajukan Proposal</a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page auth-split">
      <div className="auth-split-left">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-split-left-inner">
          <img className="auth-brand-logo" src={logoRumahBrida} alt="Rumah BRIDA" />
          <h2>Satu Akun untuk Seluruh Layanan BRIDA</h2>
          <p>Kelola proposal riset, inovasi daerah, dan akses informasi publik dalam satu platform terpadu.</p>
          <ul className="auth-highlight-list">
            {highlights.map((item) => (
              <li key={item}>
                <span className="auth-highlight-icon"><CheckBadge /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="auth-split-right">
        <div className="research-form-card auth-card">
          <header className="research-form-header">
            <p>Akun</p>
            <h1>{isRegister ? 'Daftar Akun Peneliti' : 'Masuk ke Rumah BRIDA'}</h1>
          </header>

          <div className="auth-tabs" role="tablist" aria-label="Pilihan autentikasi">
            <span className={`auth-tabs-indicator ${isRegister ? 'is-register' : ''}`} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={!isRegister ? 'is-active' : ''}
              onClick={() => switchMode('login')}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={isRegister ? 'is-active' : ''}
              onClick={() => switchMode('register')}
            >
              Daftar
            </button>
          </div>

          {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

          <form onSubmit={submitForm} noValidate>
            {isRegister && (
              <label className="auth-field">Nama Lengkap
                <div className="auth-input-wrap">
                  <UserIcon />
                  <input name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Masukkan nama lengkap" />
                </div>
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>
            )}

            <label className="auth-field">Email
              <div className="auth-input-wrap">
                <MailIcon />
                <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="nama@email.com" />
              </div>
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            <label className="auth-field">Kata Sandi
              <div className="auth-input-wrap">
                <LockIcon />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={isRegister ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                />
                <button
                  type="button"
                  className="auth-toggle-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            {isRegister && (
              <label className="auth-field">Konfirmasi Kata Sandi
                <div className="auth-input-wrap">
                  <LockIcon />
                  <input
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.password_confirmation}
                    onChange={updateField}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi"
                  />
                  <button
                    type="button"
                    className="auth-toggle-eye"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>
            )}

            <div className="form-actions">
              <a className="secondary-form-link" href="/">Kembali</a>
              <button className="primary-form-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default LoginPage