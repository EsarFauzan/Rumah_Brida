import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
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

  return (
    <section className="admin-login-page">
      <div className="admin-login-shell">
        <div className="admin-login-mark" aria-hidden="true"><ShieldCheck size={24} strokeWidth={1.8} /></div>
        <header className="admin-login-heading">
          <span>Administrasi</span>
          <h1>Masuk ke Rumah BRIDA</h1>
          <p>Akses khusus administrator.</p>
        </header>

        {feedback && <div className="form-feedback error" role="alert">{feedback}</div>}

        <form className="admin-login-form" onSubmit={submitForm} noValidate>
          <label className="auth-field">
            Email
            <div className="auth-input-wrap">
              <Mail className="auth-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
              <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="username" placeholder="admin@rumahbrida.go.id" autoFocus />
            </div>
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label className="auth-field">
            Kata Sandi
            <div className="auth-input-wrap">
              <LockKeyhole className="auth-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
              <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="current-password" placeholder="Masukkan kata sandi" />
              <button type="button" className="auth-toggle-eye" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <button className="admin-login-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <a className="admin-login-back" href="/">Kembali ke situs publik</a>
      </div>
    </section>
  )
}

export default LoginPage
