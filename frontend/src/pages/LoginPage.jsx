import { useState } from 'react'
import api from '../services/api'
import { setSession } from '../services/authStore'
import useAuth from '../hooks/useAuth'

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

function LoginPage({ redirectTo = '/riset/hasil' }) {
  const { isAuthenticated, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
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
      <section className="research-page">
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
    <section className="research-page">
      <div className="research-form-card auth-card">
        <header className="research-form-header">
          <p>Akun</p>
          <h1>{isRegister ? 'Daftar Akun Peneliti' : 'Masuk ke Rumah BRIDA'}</h1>
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Pilihan autentikasi">
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
            <label>Nama Lengkap
              <input name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Masukkan nama lengkap" />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
          )}

          <label>Email
            <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="nama@email.com" />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label>Kata Sandi
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
            />
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          {isRegister && (
            <label>Konfirmasi Kata Sandi
              <input
                name="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={updateField}
                autoComplete="new-password"
                placeholder="Ulangi kata sandi"
              />
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
    </section>
  )
}

export default LoginPage
