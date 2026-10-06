import { CalendarDays, Edit3, FileText, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import DeleteCompetitionModal from '../components/DeleteCompetitionModal'
import FieldRequirement from '../components/FieldRequirement'
import FilterSummary from '../components/FilterSummary'
import Pagination from '../components/Pagination'
import ServicePageHeader from '../components/ServicePageHeader'
import useAuth from '../hooks/useAuth'
import api from '../services/api'

const competitionTypes = ['Lomba untuk ASN', 'Lomba untuk OPD', 'Lomba untuk Masyarakat']
const emptyForm = { code: '', name: '', description: '', opening_date: '', closing_date: '', status: 'open', type: competitionTypes[0], guideline: null }
const emptyPagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
const emptyCounts = { total: 0, open: 0, closed: 0 }

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
  : '-'

function AdminCompetitionsPage() {
  const { isAdministrator, token } = useAuth()
  const formRef = useRef(null)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [counts, setCounts] = useState(emptyCounts)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [savedGuideline, setSavedGuideline] = useState('')
  const [fileKey, setFileKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!isAdministrator) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      setLoadError('')
      api.get('/admin/competitions', {
        params: { page, per_page: 10, search: search.trim() || undefined, status: statusFilter === 'all' ? undefined : statusFilter },
        signal: controller.signal,
      }).then(({ data }) => {
        if (controller.signal.aborted) return
        if (page > data.pagination.last_page) {
          setPage(Math.max(data.pagination.last_page, 1))
          return
        }
        setItems(data.data)
        setPagination(data.pagination)
        setCounts(data.counts)
      }).catch(() => {
        if (!controller.signal.aborted) setLoadError('Data lomba tidak dapat dimuat.')
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isAdministrator, page, reload, search, statusFilter, token])

  if (!isAdministrator) {
    return <section className="research-results-page"><div className="container results-state is-error">Daftar lomba hanya dapat diakses oleh admin.</div></section>
  }

  const resetForm = () => {
    setEditingId(null)
    setSavedGuideline('')
    setForm(emptyForm)
    setFileKey((value) => value + 1)
    setFeedback(null)
  }

  const update = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? (files[0] ?? null) : value }))
  }

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setFeedback(null)
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== '') data.append(key, value) })
    if (editingId) data.append('_method', 'PUT')

    try {
      const response = editingId
        ? await api.post(`/admin/competitions/${editingId}`, data)
        : await api.post('/admin/competitions', data)
      resetForm()
      setFeedback({ type: 'success', text: response.data.message })
      setPage(1)
      setReload((value) => value + 1)
    } catch (error) {
      const errors = error.response?.data?.errors
      setFeedback({ type: 'error', text: (errors ? Object.values(errors).flat()[0] : null) ?? error.response?.data?.message ?? 'Data lomba gagal disimpan.' })
    } finally {
      setSaving(false)
    }
  }

  const edit = (item) => {
    setEditingId(item.id)
    setSavedGuideline(item.guideline_original_name)
    setForm({ ...emptyForm, code: item.code, name: item.name, description: item.description, opening_date: item.opening_date, closing_date: item.closing_date, status: item.status, type: item.type })
    setFileKey((value) => value + 1)
    setFeedback(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const remove = async () => {
    if (!toDelete || deleting) return
    setDeleting(true)
    try {
      const response = await api.delete(`/admin/competitions/${toDelete.id}`)
      setToDelete(null)
      setFeedback({ type: 'success', text: response.data.message })
      setReload((value) => value + 1)
    } catch (error) {
      setToDelete(null)
      setFeedback({ type: 'error', text: error.response?.data?.message ?? 'Data lomba gagal dihapus.' })
    } finally {
      setDeleting(false)
    }
  }

  return <section className="competition-page competition-admin-page">
    <ServicePageHeader
      section="Admin"
      title="Daftar Lomba"
      description="Kelola periode, sasaran peserta, status, dan Juknis lomba."
      total={counts.total}
      totalLabel="lomba"
      action={<button className="primary-form-button competition-new-button" type="button" onClick={() => { resetForm(); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><Plus size={16} aria-hidden="true" /> Lomba Baru</button>}
    />

    <div className="competition-container competition-admin-container">
      <div className="competition-admin-stats" aria-label="Ringkasan lomba">
        <span><strong>{counts.total}</strong>Total lomba</span>
        <span><strong>{counts.open}</strong>Sedang buka</span>
        <span><strong>{counts.closed}</strong>Ditutup</span>
      </div>
      {feedback && <p className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}

      <div className="competition-admin-layout">
        <form className="competition-editor" ref={formRef} onSubmit={save}>
          <header className="competition-editor-heading">
            <div><span>{editingId ? 'Mode edit' : 'Lomba baru'}</span><h2>{editingId ? 'Perbarui data lomba' : 'Tambahkan lomba'}</h2></div>
            {editingId && <button type="button" onClick={resetForm}><X size={16} aria-hidden="true" /> Batal edit</button>}
          </header>

          <div className="competition-fields">
            <label><span><strong>Kode lomba<FieldRequirement /></strong></span><input name="code" value={form.code} onChange={update} maxLength="50" placeholder="Contoh: LMB-2026-01" required /></label>
            <label><span><strong>Nama lomba<FieldRequirement /></strong></span><input name="name" value={form.name} onChange={update} maxLength="255" placeholder="Nama kegiatan lomba" required /></label>
            <label className="is-wide"><span><strong>Deskripsi lomba<FieldRequirement /></strong><small>{form.description.length}/3000</small></span><textarea name="description" value={form.description} onChange={update} maxLength="3000" placeholder="Jelaskan tujuan, tema, dan informasi utama lomba" required /></label>
            <label><span><strong>Tanggal pembukaan<FieldRequirement /></strong></span><input name="opening_date" type="date" value={form.opening_date} onChange={update} required /></label>
            <label><span><strong>Tanggal penutupan<FieldRequirement /></strong></span><input name="closing_date" type="date" value={form.closing_date} min={form.opening_date || undefined} onChange={update} required /></label>
            <label><span><strong>Status<FieldRequirement /></strong></span><select name="status" value={form.status} onChange={update}><option value="open">Buka</option><option value="closed">Tutup</option></select></label>
            <label><span><strong>Jenis lomba<FieldRequirement /></strong></span><select name="type" value={form.type} onChange={update}>{competitionTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
            <label className="competition-guideline is-wide">
              <span><strong>Juknis<FieldRequirement required={!editingId} /></strong></span>
              <div><Upload size={20} aria-hidden="true" /><strong>{form.guideline?.name || savedGuideline || 'Pilih file Juknis'}</strong><small>PDF, maksimal 10 MB</small></div>
              <input key={fileKey} name="guideline" type="file" accept="application/pdf,.pdf" onChange={update} required={!editingId} />
            </label>
          </div>

          <footer><button className="secondary-form-button" type="button" onClick={resetForm}><RotateCcw size={15} aria-hidden="true" /> Reset</button><button className="primary-form-button" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Lomba'}</button></footer>
        </form>

        <div className="competition-list-panel">
          <header><div><span>Data tersimpan</span><h2>Semua lomba</h2></div></header>
          <div className="competition-toolbar">
            <label><Search size={17} aria-hidden="true" /><input type="search" value={search} placeholder="Cari kode atau nama lomba..." aria-label="Cari lomba" onChange={(event) => { setSearch(event.target.value); setPage(1) }} />{search && <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch('')}><X size={15} /></button>}</label>
            <select value={statusFilter} aria-label="Filter status lomba" onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="all">Semua status</option><option value="open">Buka</option><option value="closed">Tutup</option></select>
          </div>
          <FilterSummary count={pagination.total} noun="lomba" loading={loading} error={loadError} search={search} year={statusFilter} filterLabel="Status" filterValueLabel={statusFilter === 'open' ? 'Buka' : statusFilter === 'closed' ? 'Tutup' : undefined} onSearchClear={() => setSearch('')} onYearClear={() => setStatusFilter('all')} onReset={() => { setSearch(''); setStatusFilter('all'); setPage(1) }} />

          {loadError ? <div className="competition-list-state" role="alert">{loadError}</div>
            : loading ? <div className="competition-list-loading" aria-label="Memuat daftar lomba"><span /><span /><span /></div>
              : items.length === 0 ? <div className="competition-list-state"><strong>Belum ada data lomba</strong><p>Tambahkan lomba baru melalui formulir di samping.</p></div>
                : <div className="competition-admin-list">{items.map((item) => <article key={item.id}>
                  <div className="competition-item-main"><div><span className={`competition-status is-${item.status}`}>{item.status === 'open' ? 'Buka' : 'Tutup'}</span><span>{item.code}</span></div><h3>{item.name}</h3><p>{item.description}</p><small><CalendarDays size={14} aria-hidden="true" /> {formatDate(item.opening_date)} - {formatDate(item.closing_date)}</small><small>{item.type}</small></div>
                  <div className="competition-item-actions"><a href={item.guideline_url} target="_blank" rel="noreferrer" title="Lihat Juknis" aria-label={`Lihat Juknis ${item.name}`}><FileText size={16} /></a><button type="button" title="Edit lomba" aria-label={`Edit ${item.name}`} onClick={() => edit(item)}><Edit3 size={16} /></button><button className="is-danger" type="button" title="Hapus lomba" aria-label={`Hapus ${item.name}`} onClick={() => setToDelete(item)}><Trash2 size={16} /></button></div>
                </article>)}</div>}
          {!loading && !loadError && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      </div>
    </div>

    <DeleteCompetitionModal open={toDelete !== null} competitionName={toDelete?.name} isDeleting={deleting} onCancel={() => setToDelete(null)} onConfirm={remove} />
  </section>
}

export default AdminCompetitionsPage
