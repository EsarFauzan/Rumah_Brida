import { ArrowLeft, ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import logoRumahBrida from '../assets/image/logo-fix.webp'
import logoRumahBridaDark from '../assets/image/logo-fix-dark.png'
import api from '../services/api'
import { setSession } from '../services/authStore'

const navigateTo = (path) => {
  window.history.replaceState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFeedback('')
  }

  const submitForm = async (event) => {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setErrors({})
    setFeedback('')

    try {
      const response = await api.post('/auth/login', form)
      const { token, user } = response.data.data
      setSession(token, user)
      navigateTo('/admin')
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors ?? {}
        setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, value[0]])))
        setFeedback('Periksa kembali email dan kata sandi.')
      } else if (error.response?.status === 403) {
        setFeedback(error.response.data.message ?? 'Akun ini tidak memiliki akses administrator.')
      } else if (error.response?.status === 429) {
        setFeedback('Terlalu banyak percobaan. Coba lagi beberapa saat.')
      } else {
        setFeedback('Layanan login belum dapat dihubungi. Coba kembali beberapa saat lagi.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const emailErrorId = errors.email ? 'login-email-error' : undefined
  const passwordErrorId = errors.password ? 'login-password-error' : undefined

  return (
    <section className="admin-login-page">
      <div className="admin-login-layout">
        <aside className="admin-login-aside">
          <div className="admin-login-aside-brand">
            <span className="admin-login-kicker">Portal Resmi</span>
            <h1 className="admin-login-aside-title">
              Selamat Datang<br />
              <span>di Rumah BRIDA</span>
            </h1>
            <p className="admin-login-tagline">
              Akses administrator untuk pengelolaan riset, inovasi, dan lomba daerah.
            </p>
          </div>
          <div className="admin-login-aside-system">
            <Fingerprint className="admin-login-system-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Sesi terenkripsi. Aktivitas login administrator tercatat oleh sistem.</span>
          </div>
        </aside>

        <div className="admin-login-card">
          <div className="admin-login-brand">
            <img className="admin-login-brand-logo" src={logoRumahBrida} alt="Logo Rumah BRIDA" />
            <img className="admin-login-brand-logo dark" src={logoRumahBridaDark} alt="" aria-hidden="true" />
          </div>
          <header className="admin-login-heading">
            <h2>Masuk ke akun</h2>
            <p>Gunakan akun administrator yang diterbitkan superadmin.</p>
          </header>

          {feedback && <div className="form-feedback error" role="alert">{feedback}</div>}

          <form className="admin-login-form" onSubmit={submitForm} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <Mail className="auth-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="username"
                  autoFocus
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={emailErrorId}
                />
              </div>
              {errors.email && <small id="login-email-error" className="field-error">{errors.email}</small>}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Kata Sandi</label>
              <div className="auth-input-wrap">
                <LockKeyhole className="auth-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={passwordErrorId}
                />
                <button
                  type="button"
                  className="auth-toggle-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <small id="login-password-error" className="field-error">{errors.password}</small>}
            </div>

            <button className="admin-login-submit" type="submit" disabled={isSaving}>
              {isSaving ? 'Memverifikasi...' : (
                <>
                  Masuk
                  <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" className="admin-login-submit-arrow" />
                </>
              )}
            </button>
          </form>

          <a className="admin-login-back" href="/">
            <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
            Kembali ke situs publik
          </a>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
