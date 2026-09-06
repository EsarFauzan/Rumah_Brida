import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import DeleteNewsModal from '../components/DeleteNewsModal'

const emptyForm = { title: '', card_title: '', slug: '', category: 'BRIDA', summary: '', content: '', status: 'draft', image: null, secondary_image: null }

function AdminNewsPage() {
  const { isAuthenticated, user, token } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [newsToDelete, setNewsToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => api.get('/admin/news').then((response) => setItems(response.data.data)).catch(() => setMessage('Data berita tidak dapat dimuat.'))
  useEffect(() => { if (isAuthenticated && user?.role === 'admin') load() }, [isAuthenticated, token, user?.role])
  if (!isAuthenticated || user?.role !== 'admin') return <section className="research-results-page"><div className="container results-state is-error">Dashboard berita hanya untuk admin.</div></section>

  const update = (event) => { const { name, value, files } = event.target; setForm((current) => ({ ...current, [name]: files ? files[0] : value })) }
  const save = async (event) => {
    event.preventDefault(); setIsSaving(true); setMessage('')
    const data = new FormData(); Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== '') data.append(key, value) })
    if (editingId) data.append('_method', 'PUT')
    try { editingId ? await api.post(`/admin/news/${editingId}`, data) : await api.post('/admin/news', data); setForm(emptyForm); setEditingId(null); setMessage('Berita berhasil disimpan.'); load() } catch (error) { setMessage(error.response?.data?.message ?? 'Berita gagal disimpan.') } finally { setIsSaving(false) }
  }
  const edit = (item) => { setEditingId(item.id); setForm({ ...emptyForm, title: item.title, card_title: item.card_title ?? '', slug: item.slug, category: item.category, summary: item.summary, content: item.content ?? '', status: item.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const remove = async (item) => {
    if (deletingId !== null) return

    setDeletingId(item.id)
    setMessage('')

    try {
      await api.delete(`/admin/news/${item.id}`)
      setItems((current) => current.filter((newsItem) => newsItem.id !== item.id))
      setNewsToDelete(null)
    } catch (error) {
      const status = error.response?.status

      if (status === 401) setMessage('Sesi Anda berakhir. Silakan masuk kembali sebagai admin.')
      else if (status === 403) setMessage('Anda tidak berhak menghapus berita ini.')
      else setMessage('Berita gagal dihapus. Silakan coba kembali.')
      setNewsToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return <section className="research-results-page admin-news-page"><div className="container"><header className="results-header"><div><p>Admin</p><h1>Kelola Berita</h1><span>Tambah, edit, dan terbitkan berita portal.</span></div></header><form className="admin-news-form" onSubmit={save}><input name="title" placeholder="Judul berita" value={form.title} onChange={update} required /><input name="card_title" placeholder="Judul singkat kartu (opsional)" value={form.card_title} onChange={update} /><input name="slug" placeholder="Slug otomatis jika kosong" value={form.slug} onChange={update} /><input name="category" placeholder="Kategori" value={form.category} onChange={update} required /><textarea name="summary" placeholder="Ringkasan" value={form.summary} onChange={update} required /><textarea name="content" placeholder="Isi berita. Pisahkan paragraf dengan satu baris kosong." value={form.content} onChange={update} required /><label>Gambar utama<input name="image" type="file" accept="image/*" onChange={update} /></label><label>Gambar tambahan<input name="secondary_image" type="file" accept="image/*" onChange={update} /></label><select name="status" value={form.status} onChange={update}><option value="draft">Draft</option><option value="published">Terbitkan</option></select><div className="form-actions"><button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Batal</button><button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Berita'}</button></div></form>{message && <p className="form-feedback">{message}</p>}<div className="research-results-list">{items.map((item) => <article className="research-result-item" key={item.id}><div className="result-number">{String(item.id).padStart(2, '0')}</div><div className="result-main"><span className={`result-status is-${item.status === 'published' ? 'approved' : 'draft'}`}>{item.status === 'published' ? 'Terbit' : 'Draft'}</span><h2>{item.title}</h2><p>{item.summary}</p></div><div className="result-actions"><button className="result-action" type="button" onClick={() => edit(item)}>Edit</button><button className="result-action danger" type="button" disabled={deletingId === item.id} onClick={() => setNewsToDelete(item)}>{deletingId === item.id ? 'Menghapus...' : 'Hapus'}</button></div></article>)}</div></div>
      <DeleteNewsModal
        open={newsToDelete !== null}
        newsTitle={newsToDelete?.title}
        isDeleting={deletingId !== null}
        onCancel={() => setNewsToDelete(null)}
        onConfirm={() => remove(newsToDelete)}
      />
      </section>
}

export default AdminNewsPage
