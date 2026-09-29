import { Edit3, KeyRound, Plus, Search, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ServiceDialog from '../components/ServiceDialog'
import ServicePageHeader from '../components/ServicePageHeader'
import useAuth from '../hooks/useAuth'
import api from '../services/api'

const emptyAccount = { name: '', email: '', password: '', password_confirmation: '' }
const emptyPassword = { password: '', password_confirmation: '' }

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
  : '-'

const requestMessage = (error, fallback) => {
  const errors = error.response?.data?.errors
  return (errors ? Object.values(errors).flat()[0] : null) ?? error.response?.data?.message ?? fallback
}

function AdminAdministratorsPage() {
  const { isSuperAdmin, token } = useAuth()
  const [administrators, setAdministrators] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [accountForm, setAccountForm] = useState(emptyAccount)
  const [passwordForm, setPasswordForm] = useState(emptyPassword)
  const [busy, setBusy] = useState(false)

  const loadAdministrators = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/administrators')
      setAdministrators(response.data.data)
    } catch (requestError) {
      setError(requestMessage(requestError, 'Daftar administrator belum dapat dimuat.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      api.get('/admin/administrators', { signal: controller.signal })
        .then((response) => setAdministrators(response.data.data))
        .catch((requestError) => {
          if (!controller.signal.aborted) setError(requestMessage(requestError, 'Daftar administrator belum dapat dimuat.'))
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isSuperAdmin, token])

  const filteredAdministrators = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('id-ID')
    if (!keyword) return administrators
    return administrators.filter((item) => `${item.name} ${item.email} ${item.role}`.toLocaleLowerCase('id-ID').includes(keyword))
  }, [administrators, search])

  const openCreate = () => {
    if (busy) return
    setAccountForm(emptyAccount)
    setFeedback(null)
    setDialog({ type: 'create' })
  }

  const openEdit = (administrator) => {
    if (busy) return
    setAccountForm({ ...emptyAccount, name: administrator.name, email: administrator.email })
    setFeedback(null)
    setDialog({ type: 'edit', administrator })
  }

  const openPassword = (administrator) => {
    if (busy) return
    setPasswordForm(emptyPassword)
    setFeedback(null)
    setDialog({ type: 'password', administrator })
  }

  const closeDialog = () => {
    if (!busy) setDialog(null)
  }

  const updateAccountField = (event) => {
    const { name, value } = event.target
    setAccountForm((current) => ({ ...current, [name]: value }))
  }

  const updatePasswordField = (event) => {
    const { name, value } = event.target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  const saveAccount = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const isEdit = dialog.type === 'edit'
      const response = isEdit
        ? await api.put(`/admin/administrators/${dialog.administrator.id}`, { name: accountForm.name, email: accountForm.email })
        : await api.post('/admin/administrators', accountForm)
      setFeedback({ type: 'success', message: response.data.message })
      setDialog(null)
      await loadAdministrators()
    } catch (requestError) {
      setFeedback({ type: 'error', message: requestMessage(requestError, 'Administrator gagal disimpan.') })
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const response = await api.patch(`/admin/administrators/${dialog.administrator.id}/password`, passwordForm)
      setFeedback({ type: 'success', message: response.data.message })
      setDialog(null)
    } catch (requestError) {
      setFeedback({ type: 'error', message: requestMessage(requestError, 'Kata sandi gagal diubah.') })
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = async () => {
    if (busy) return
    setBusy(true)
    const administrator = dialog.administrator
    try {
      const response = await api.patch(`/admin/administrators/${administrator.id}/status`, { is_active: !administrator.is_active })
      setFeedback({ type: 'success', message: response.data.message })
      setDialog(null)
      await loadAdministrators()
    } catch (requestError) {
      setFeedback({ type: 'error', message: requestMessage(requestError, 'Status administrator gagal diperbarui.') })
    } finally {
      setBusy(false)
    }
  }

  if (!isSuperAdmin) return null

  return (
    <section className="administrator-page">
      <ServicePageHeader
        section="Admin"
        title="Kelola Administrator"
        description="Kelola akun administrator Rumah BRIDA."
        total={administrators.length}
        totalLabel="akun"
        action={<button className="administrator-add" type="button" onClick={openCreate} disabled={busy}><Plus size={17} aria-hidden="true" />Tambah Admin</button>}
      />

      <div className="administrator-container">
        {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

        <div className="administrator-toolbar">
          <Search size={18} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email administrator..." aria-label="Cari administrator" />
        </div>

        {loading && <div className="administrator-loading" aria-label="Memuat administrator"><span /><span /><span /></div>}
        {!loading && error && <div className="administrator-state is-error" role="alert"><strong>Data belum dapat dimuat</strong><p>{error}</p><button type="button" onClick={loadAdministrators}>Coba lagi</button></div>}
        {!loading && !error && filteredAdministrators.length === 0 && <div className="administrator-state"><ShieldCheck size={26} aria-hidden="true" /><strong>Tidak ada administrator ditemukan</strong><p>Ubah kata kunci pencarian atau tambahkan administrator baru.</p></div>}

        {!loading && !error && filteredAdministrators.length > 0 && (
          <div className="administrator-table-wrap">
            <table className="administrator-table responsive-records">
              <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Dibuat</th><th>Action</th></tr></thead>
              <tbody>
                {filteredAdministrators.map((administrator) => {
                  const manageable = administrator.role === 'admin'
                  return <tr key={administrator.id}>
                    <td data-label="Nama"><strong>{administrator.name}</strong></td>
                    <td data-label="Email">{administrator.email}</td>
                    <td data-label="Role"><span className={`administrator-role is-${administrator.role}`}>{administrator.role === 'superadmin' ? 'Superadmin' : 'Administrator'}</span></td>
                    <td data-label="Status"><span className={`administrator-status ${administrator.is_active ? 'is-active' : 'is-inactive'}`}>{administrator.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td data-label="Dibuat">{formatDate(administrator.created_at)}</td>
                    <td data-label="Action">
                      {manageable ? <div className="administrator-actions">
                        <button type="button" title="Edit administrator" aria-label={`Edit ${administrator.name}`} onClick={() => openEdit(administrator)} disabled={busy}><Edit3 size={16} aria-hidden="true" /></button>
                        <button type="button" title="Ubah kata sandi" aria-label={`Ubah kata sandi ${administrator.name}`} onClick={() => openPassword(administrator)} disabled={busy}><KeyRound size={16} aria-hidden="true" /></button>
                        <button className={administrator.is_active ? 'is-danger' : 'is-success'} type="button" title={administrator.is_active ? 'Nonaktifkan administrator' : 'Aktifkan administrator'} aria-label={`${administrator.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${administrator.name}`} onClick={() => { if (!busy) setDialog({ type: 'status', administrator }) }} disabled={busy}>{administrator.is_active ? <UserX size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}</button>
                      </div> : <span className="administrator-readonly">Dikelola via CLI</span>}
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(dialog?.type === 'create' || dialog?.type === 'edit') && <ServiceDialog title={dialog.type === 'create' ? 'Tambah Administrator' : 'Edit Administrator'} onClose={closeDialog} busy={busy} footer={<><button className="secondary-form-button" type="button" onClick={closeDialog} disabled={busy}>Batal</button><button className="primary-form-button" type="submit" form="administrator-account-form" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button></>}>
        <form className="administrator-dialog-form" id="administrator-account-form" onSubmit={saveAccount}>
          {feedback?.type === 'error' && <div className="form-feedback error" role="alert">{feedback.message}</div>}
          <label>Nama<input name="name" value={accountForm.name} onChange={updateAccountField} autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" value={accountForm.email} onChange={updateAccountField} autoComplete="email" required /></label>
          {dialog.type === 'create' && <><label>Password<input name="password" type="password" value={accountForm.password} onChange={updateAccountField} autoComplete="new-password" minLength="8" required /></label><label>Konfirmasi Password<input name="password_confirmation" type="password" value={accountForm.password_confirmation} onChange={updateAccountField} autoComplete="new-password" minLength="8" required /></label></>}
          <p>Role akun baru ditetapkan otomatis sebagai Administrator.</p>
        </form>
      </ServiceDialog>}

      {dialog?.type === 'password' && <ServiceDialog title="Ubah Kata Sandi" onClose={closeDialog} busy={busy} footer={<><button className="secondary-form-button" type="button" onClick={closeDialog} disabled={busy}>Batal</button><button className="primary-form-button" type="submit" form="administrator-password-form" disabled={busy}>{busy ? 'Menyimpan...' : 'Ubah Password'}</button></>}>
        <form className="administrator-dialog-form" id="administrator-password-form" onSubmit={savePassword}>
          {feedback?.type === 'error' && <div className="form-feedback error" role="alert">{feedback.message}</div>}
          <p>Kata sandi baru untuk <strong>{dialog.administrator.name}</strong>. Semua sesi lama akun ini akan dicabut.</p>
          <label>Password Baru<input name="password" type="password" value={passwordForm.password} onChange={updatePasswordField} autoComplete="new-password" minLength="8" required /></label>
          <label>Konfirmasi Password<input name="password_confirmation" type="password" value={passwordForm.password_confirmation} onChange={updatePasswordField} autoComplete="new-password" minLength="8" required /></label>
        </form>
      </ServiceDialog>}

      {dialog?.type === 'status' && <ServiceDialog title={dialog.administrator.is_active ? 'Nonaktifkan Administrator' : 'Aktifkan Administrator'} onClose={closeDialog} busy={busy} footer={<><button className="secondary-form-button" type="button" onClick={closeDialog} disabled={busy}>Batal</button><button className={dialog.administrator.is_active ? 'administrator-confirm-danger' : 'primary-form-button'} type="button" onClick={updateStatus} disabled={busy}>{busy ? 'Memproses...' : dialog.administrator.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></>}>
        <div className="administrator-confirmation">{feedback?.type === 'error' && <div className="form-feedback error" role="alert">{feedback.message}</div>}<p>{dialog.administrator.is_active ? 'Akun akan segera kehilangan akses dan seluruh token aktifnya dicabut.' : 'Akun akan kembali dapat masuk ke panel administrator.'}</p><strong>{dialog.administrator.name}</strong><span>{dialog.administrator.email}</span></div>
      </ServiceDialog>}
    </section>
  )
}

export default AdminAdministratorsPage
