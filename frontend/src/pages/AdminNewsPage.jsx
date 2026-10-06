import { useEffect, useRef, useState } from 'react'
import { Edit3, ExternalLink, FileImage, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import DeleteNewsModal from '../components/DeleteNewsModal'
import FieldRequirement from '../components/FieldRequirement'
import FilterSummary from '../components/FilterSummary'
import Pagination from '../components/Pagination'
import ServicePageHeader from '../components/ServicePageHeader'
import useAuth from '../hooks/useAuth'
import api from '../services/api'

const emptyForm = { title: '', card_title: '', slug: '', category: 'BRIDA', summary: '', content: '', status: 'draft', image: null, homepage_thumbnail: null, secondary_image: null }
const emptyMedia = { image_url: '', homepage_thumbnail_url: '', secondary_image_url: '' }
const emptyPagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
const emptyCounts = { total: 0, published: 0, draft: 0 }

function ImageUploadField({ name, label, hint, file, existingUrl, inputKey, onChange, className = '', required = false }) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!file) return undefined
    const reader = new FileReader()
    const updatePreview = () => setPreview(typeof reader.result === 'string' ? reader.result : '')
    reader.addEventListener('load', updatePreview)
    reader.readAsDataURL(file)
    return () => {
      reader.removeEventListener('load', updatePreview)
      if (reader.readyState === FileReader.LOADING) reader.abort()
    }
  }, [file])

  const source = preview || existingUrl

  return <label className={`news-admin-upload${className ? ` ${className}` : ''}`}>
    <span className="news-admin-label"><strong>{label}<FieldRequirement required={required} /></strong></span>
    <span className={`news-admin-upload-box${source ? ' has-preview' : ''}`}>
      {source ? <img src={source} alt={`Pratinjau ${label.toLowerCase()}`} /> : <FileImage size={24} aria-hidden="true" />}
      <span>{file?.name || (existingUrl ? 'Gambar saat ini' : 'Pilih gambar')}</span>
    </span>
    <input key={inputKey} name={name} type="file" accept="image/*" onChange={onChange} />
    <small>{hint}</small>
  </label>
}

function AdminNewsPage() {
  const { isAdministrator, token } = useAuth()
  const formRef = useRef(null)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [counts, setCounts] = useState(emptyCounts)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingMedia, setEditingMedia] = useState(emptyMedia)
  const [editingId, setEditingId] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newsToDelete, setNewsToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!isAdministrator) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setLoadError('')
      api.get('/admin/news', {
        params: { page, per_page: 10, search: searchTerm.trim() || undefined, status: statusFilter === 'all' ? undefined : statusFilter },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (page > data.pagination.last_page) {
            setPage(Math.max(data.pagination.last_page, 1))
            return
          }
          setItems(data.data)
          setPagination(data.pagination)
          setCounts(data.counts)
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setItems([])
          setLoadError('Data berita tidak dapat dimuat.')
        })
        .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isAdministrator, page, reload, searchTerm, statusFilter, token])

  if (!isAdministrator) {
    return <section className="research-results-page"><div className="container results-state is-error">Dashboard berita hanya untuk admin.</div></section>
  }

  const resetForm = () => {
    setEditingId(null)
    setEditingMedia(emptyMedia)
    setForm(emptyForm)
    setFileInputKey((value) => value + 1)
    setFeedback(null)
  }

  const update = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? (files[0] ?? null) : value }))
  }

  const save = async (event) => {
    event.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setFeedback(null)
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== '') data.append(key, value) })
    if (editingId) data.append('_method', 'PUT')

    try {
      const response = editingId ? await api.post(`/admin/news/${editingId}`, data) : await api.post('/admin/news', data)
      resetForm()
      setFeedback({ type: 'success', text: response.data.message ?? 'Berita berhasil disimpan.' })
      setPage(1)
      setReload((value) => value + 1)
    } catch (error) {
      const validationErrors = error.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors).flat()[0] : null
      setFeedback({ type: 'error', text: firstError ?? error.response?.data?.message ?? 'Berita gagal disimpan.' })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (item) => {
    setEditingId(item.id)
    setEditingMedia({ image_url: item.image_url ?? '', homepage_thumbnail_url: item.homepage_thumbnail_url ?? '', secondary_image_url: item.secondary_image_url ?? '' })
    setForm({ ...emptyForm, title: item.title, card_title: item.card_title ?? '', slug: item.slug, category: item.category, summary: item.summary, content: item.content ?? '', status: item.status })
    setFileInputKey((value) => value + 1)
    setFeedback(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const remove = async (item) => {
    if (!item || deletingId !== null) return
    setDeletingId(item.id)
    setFeedback(null)
    try {
      await api.delete(`/admin/news/${item.id}`)
      setNewsToDelete(null)
      setFeedback({ type: 'success', text: 'Berita berhasil dihapus.' })
      setReload((value) => value + 1)
    } catch (error) {
      const status = error.response?.status
      const text = status === 401 ? 'Sesi Anda berakhir. Silakan masuk kembali sebagai admin.' : status === 403 ? 'Anda tidak berhak menghapus berita ini.' : 'Berita gagal dihapus. Silakan coba kembali.'
      setFeedback({ type: 'error', text })
      setNewsToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPage(1)
  }

  return <section className="news-admin-page">
    <ServicePageHeader section="Admin" title="Kelola Berita" description="Tulis, tinjau, dan terbitkan informasi portal dari satu halaman." total={counts.total} totalLabel="berita"
      action={<button className="primary-form-button news-admin-new" type="button" onClick={() => { resetForm(); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><Plus size={16} aria-hidden="true" /> Berita Baru</button>} />

    <div className="news-admin-container">
      <div className="news-admin-stats" aria-label="Ringkasan berita">
        <span><strong>{counts.total}</strong> Total berita</span><span><strong>{counts.published}</strong> Telah terbit</span><span><strong>{counts.draft}</strong> Masih draft</span>
      </div>
      {feedback && <p className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}

      <div className="news-admin-layout">
        <form ref={formRef} className="news-admin-editor" onSubmit={save}>
          <header className="news-admin-editor-heading">
            <div><span>{editingId ? 'Mode edit' : 'Berita baru'}</span><h2>{editingId ? 'Perbarui berita' : 'Tulis berita'}</h2></div>
            {editingId && <button type="button" onClick={resetForm}><X size={16} aria-hidden="true" /> Batal edit</button>}
          </header>
          <div className="news-admin-fields">
            <label className="news-admin-field is-wide"><span className="news-admin-label"><strong>Judul berita<FieldRequirement /></strong></span><input name="title" value={form.title} onChange={update} placeholder="Masukkan judul lengkap" required /></label>
            <label className="news-admin-field"><span className="news-admin-label"><strong>Judul kartu</strong></span><input name="card_title" value={form.card_title} onChange={update} placeholder="Versi singkat untuk daftar" maxLength={120} /></label>
            <label className="news-admin-field"><span className="news-admin-label"><strong>Kategori<FieldRequirement /></strong></span><input name="category" value={form.category} onChange={update} placeholder="Contoh: Riset" maxLength={80} required /></label>
            <label className="news-admin-field is-wide"><span className="news-admin-label"><strong>Slug URL</strong><small>Otomatis jika kosong</small></span><input name="slug" value={form.slug} onChange={update} placeholder="agenda-riset-daerah" /></label>
            <label className="news-admin-field is-wide"><span className="news-admin-label"><strong>Ringkasan<FieldRequirement /></strong><small>{form.summary.length}/500</small></span><textarea name="summary" value={form.summary} onChange={update} placeholder="Ringkasan singkat yang tampil pada kartu berita" maxLength={500} required /></label>
            <label className="news-admin-field is-wide"><span className="news-admin-label"><strong>Isi berita<FieldRequirement /></strong></span><textarea className="news-admin-content" name="content" value={form.content} onChange={update} placeholder="Tulis isi berita. Pisahkan paragraf dengan satu baris kosong." required /></label>
            <div className="news-admin-media is-wide">
              <ImageUploadField key={`thumbnail-${fileInputKey}-${form.homepage_thumbnail?.name ?? 'empty'}-${form.homepage_thumbnail?.lastModified ?? 0}`} name="homepage_thumbnail" label="Thumbnail homepage" hint="Disarankan landscape 16:9, minimal 1200 x 675 px. Maksimal 5 MB." file={form.homepage_thumbnail} existingUrl={editingMedia.homepage_thumbnail_url} inputKey={`thumbnail-${fileInputKey}`} onChange={update} className="is-homepage-thumbnail" required />
              <ImageUploadField key={`image-${fileInputKey}-${form.image?.name ?? 'empty'}-${form.image?.lastModified ?? 0}`} name="image" label="Gambar utama / poster" hint="Ditampilkan pada halaman detail berita. Maksimal 5 MB." file={form.image} existingUrl={editingMedia.image_url} inputKey={`image-${fileInputKey}`} onChange={update} />
              <ImageUploadField key={`secondary-${fileInputKey}-${form.secondary_image?.name ?? 'empty'}-${form.secondary_image?.lastModified ?? 0}`} name="secondary_image" label="Gambar tambahan" hint="Dokumentasi tambahan, maksimal 5 MB." file={form.secondary_image} existingUrl={editingMedia.secondary_image_url} inputKey={`secondary-${fileInputKey}`} onChange={update} />
            </div>
            <label className="news-admin-field is-wide"><span className="news-admin-label"><strong>Status publikasi<FieldRequirement /></strong></span><select name="status" value={form.status} onChange={update}><option value="draft">Simpan sebagai draft</option><option value="published">Terbitkan ke publik</option></select><small className="news-admin-help">Berita draft tidak akan muncul pada Beranda maupun arsip publik.</small></label>
          </div>
          <footer className="news-admin-editor-actions"><button className="secondary-form-button" type="button" onClick={resetForm}><RotateCcw size={15} aria-hidden="true" /> Reset</button><button className="primary-form-button" type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Berita'}</button></footer>
        </form>

        <div className="news-admin-list-panel">
          <div className="news-admin-list-heading"><div><span>Daftar konten</span><h2>Semua berita</h2></div></div>
          <div className="news-admin-toolbar">
            <label className="research-results-search"><Search size={17} aria-hidden="true" /><input type="search" value={searchTerm} placeholder="Cari judul atau kategori..." aria-label="Cari berita admin" onChange={(event) => { setSearchTerm(event.target.value); setPage(1) }} />{searchTerm && <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearchTerm(''); setPage(1) }}><X size={15} aria-hidden="true" /></button>}</label>
            <select value={statusFilter} aria-label="Filter status berita" onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="all">Semua status</option><option value="published">Telah terbit</option><option value="draft">Draft</option></select>
          </div>
          <FilterSummary count={pagination.total} noun="berita" loading={isLoading} error={loadError} search={searchTerm} year={statusFilter} filterLabel="Status" filterValueLabel={statusFilter === 'published' ? 'Terbit' : 'Draft'}
            onSearchClear={() => { setSearchTerm(''); setPage(1) }} onYearClear={() => { setStatusFilter('all'); setPage(1) }} onReset={clearFilters} />
          {loadError ? <div className="news-admin-state" role="alert">{loadError}</div>
            : isLoading ? <div className="news-admin-loading" aria-label="Memuat daftar berita">{[1, 2, 3, 4].map((item) => <span key={item} />)}</div>
              : items.length === 0 ? <div className="news-admin-state"><strong>Berita tidak ditemukan</strong><span>Ubah kata pencarian atau filter status yang digunakan.</span></div>
                : <div className="news-admin-list">{items.map((item) => <article className="news-admin-item" key={item.id}>
                  <div className="news-admin-thumb">{item.homepage_thumbnail_url || item.image_url ? <img src={item.homepage_thumbnail_url || item.image_url} alt="" loading="lazy" /> : <FileImage size={22} aria-hidden="true" />}</div>
                  <div className="news-admin-item-main"><div className="news-admin-item-meta"><span className={`news-admin-status is-${item.status}`}>{item.status === 'published' ? 'Terbit' : 'Draft'}</span><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.summary}</p></div>
                  <div className="news-admin-item-actions">
                    {item.status === 'published' && <a href={`/berita/${item.slug}`} target="_blank" rel="noreferrer" aria-label={`Lihat ${item.title}`} title="Lihat berita"><ExternalLink size={16} aria-hidden="true" /></a>}
                    <button type="button" onClick={() => edit(item)} aria-label={`Edit ${item.title}`} title="Edit berita"><Edit3 size={16} aria-hidden="true" /></button>
                    <button className="is-danger" type="button" disabled={deletingId === item.id} onClick={() => setNewsToDelete(item)} aria-label={`Hapus ${item.title}`} title="Hapus berita"><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                </article>)}</div>}
          {!isLoading && !loadError && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      </div>
    </div>
    <DeleteNewsModal open={newsToDelete !== null} newsTitle={newsToDelete?.title} isDeleting={deletingId !== null} onCancel={() => setNewsToDelete(null)} onConfirm={() => remove(newsToDelete)} />
  </section>
}

export default AdminNewsPage
