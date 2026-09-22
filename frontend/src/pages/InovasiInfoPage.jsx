import { useEffect, useMemo, useState } from 'react'
import { storageUrl } from '../utils/fileUrl'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import ConfirmModal from '../components/ConfirmModal'

function InovasiInfoPage() {
  const [innovations, setInnovations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const { user, isAuthenticated } = useAuth()

  const loadInnovations = () => {
    setIsLoading(true)
    setFeedback(null)

    api.get('/innovations')
      .then((response) => setInnovations(response.data.data.data ?? []))
      .catch(() => setFeedback({ type: 'error', message: 'Gagal memuat data inovasi.' }))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadInnovations()
  }, [])

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeletingId(pendingDelete.id)
    try {
      await api.delete(`/innovations/${pendingDelete.id}`)
      setInnovations((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (error) {
      if (error.response?.status === 403) {
        setFeedback({ type: 'error', message: 'Anda tidak memiliki izin menghapus data ini.' })
      } else {
        setFeedback({ type: 'error', message: 'Gagal menghapus data. Coba lagi.' })
      }
      setPendingDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const availableYears = useMemo(() => {
    const years = new Set(innovations.map((item) => item.reporting_year))
    return Array.from(years).sort((a, b) => b - a)
  }, [innovations])

  const filteredInnovations = useMemo(() => {
    return innovations.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.innovator_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesYear = yearFilter === 'all' || String(item.reporting_year) === String(yearFilter)
      return matchesSearch && matchesYear
    })
  }, [innovations, searchTerm, yearFilter])

  return (
    <section className="if-page">
      <style>{styles}</style>

      <div className="if-hero">
        <div className="if-hero-inner">
          <div>
            <div className="if-crumb">
              Inovasi <span className="if-crumb-dot" /> <b>Info Inovasi</b>
            </div>
            <h1>Info Inovasi</h1>
            <p>Jelajahi seluruh inovasi daerah yang telah tercatat dan terverifikasi.</p>
          </div>
          <div className="if-stat">
            <div className="if-stat-value">{innovations.length}</div>
            <div className="if-stat-label">Total Inovasi</div>
          </div>
        </div>
      </div>

      <div className="if-container">
        {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

        {!isLoading && innovations.length > 0 && (
          <div className="if-toolbar">
            <div className="if-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari judul atau nama inovator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="if-search-clear" onClick={() => setSearchTerm('')}>
                  <XIcon />
                </button>
              )}
            </div>
            <div className="if-year-select">
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="if-skeleton-grid">
            {[1, 2, 3, 4].map((n) => (
              <div className="if-skeleton-card" key={n} />
            ))}
          </div>
        ) : innovations.length === 0 ? (
          <div className="if-empty">
            <div className="if-empty-icon"><EmptyIcon /></div>
            <h3>Belum Ada Data Inovasi</h3>
            <p>Data inovasi yang ditambahkan akan muncul di sini.</p>
          </div>
        ) : filteredInnovations.length === 0 ? (
          <div className="if-empty">
            <div className="if-empty-icon"><SearchIcon size={32} /></div>
            <h3>Tidak Ditemukan</h3>
            <p>Coba ubah kata kunci pencarian atau filter tahun.</p>
          </div>
        ) : (
          <div className="if-grid">
            {filteredInnovations.map((item) => {
              const isOwner = isAuthenticated && user?.id === item.user_id
              return (
                <article className="if-card" key={item.id}>
                  <div className="if-card-top">
                    <span className="if-badge-year">{item.reporting_year}</span>
                    {isOwner && (
                      <div className="if-card-actions">
                        <a className="if-icon-btn" href={`/inovasi/edit/${item.id}`} title="Edit">
                          <EditIcon />
                        </a>
                        <button
                          type="button"
                          className="if-icon-btn if-icon-btn-danger"
                          onClick={() => setPendingDelete(item)}
                          disabled={deletingId === item.id}
                          title="Hapus"
                        >
                          {deletingId === item.id ? <span className="if-mini-spinner" /> : <TrashIcon />}
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="if-card-title">{item.title}</h3>

                  <div className="if-card-innovator">
                    <UserIcon />
                    <span>{item.innovator_name}</span>
                  </div>

                  <span className="if-badge-type">{item.innovation_type}</span>

                  <div className="if-card-affair">
                    <BuildingIcon />
                    <span>{item.government_affair}</span>
                  </div>

                  <div className="if-card-footer">
                    {item.profile_pdf_path && (
                      
                      <a
                        className="if-file-link"
                        href={storageUrl(item.profile_pdf_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileIcon /> Profil
                      </a>
                    )}
                    {item.report_pdf_path && (
                      
                      <a
                        className="if-file-link"
                        href={storageUrl(item.report_pdf_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileIcon /> Laporan
                      </a>
                    )}
                    {!item.profile_pdf_path && !item.report_pdf_path && (
                      <span className="if-file-empty">Tidak ada berkas</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Hapus Data Inovasi"
        description="Yakin ingin menghapus data inovasi"
        target={pendingDelete ? `"${pendingDelete.title}"` : ''}
        warning="Tindakan ini tidak bisa dibatalkan. File PDF yang terkait juga akan ikut terhapus."
        isProcessing={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="17" rx="1.5" />
      <path d="M8 8h1.5M8 12h1.5M8 16h1.5M14.5 8H16M14.5 12H16M14.5 16H16" />
    </svg>
  )
}

function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7l2-3h14l2 3M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18" />
      <path d="M9 11h6" />
    </svg>
  )
}

const styles = `
.if-page { min-height: 100vh; background: var(--bg-soft); padding-bottom: 80px; }

.if-hero {
  background: linear-gradient(120deg, var(--navy-deep) 0%, var(--navy) 100%);
  padding: 36px 40px 40px; color: #fff; position: relative; overflow: hidden;
}
.if-hero::before {
  content: ''; position: absolute; right: -60px; top: -80px; width: 280px; height: 280px; border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--yellow) 35%, transparent), transparent 70%);
}
.if-hero-inner {
  max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end;
  gap: 24px; position: relative; flex-wrap: wrap;
}
.if-crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,.65); margin-bottom: 10px; }
.if-crumb-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,.4); display: inline-block; }
.if-crumb b { color: var(--yellow); font-weight: 700; }
.if-hero h1 { font-family: var(--font-display); font-size: 30px; margin: 0 0 8px; font-weight: 700; }
.if-hero p { margin: 0; font-size: 14px; color: rgba(255,255,255,.78); max-width: 520px; line-height: 1.6; }

.if-stat {
  background: rgba(255,255,255,.1); padding: 14px 26px; border-radius: 16px; text-align: center; min-width: 120px;
}
.if-stat-value { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: #fff; line-height: 1; }
.if-stat-label { font-size: 11.5px; color: rgba(255,255,255,.65); margin-top: 6px; text-transform: uppercase; letter-spacing: .04em; }

.if-container { max-width: 1100px; margin: -20px auto 0; padding: 0 40px; position: relative; }

.if-toolbar { display: flex; gap: 14px; margin: 22px 0 26px; flex-wrap: wrap; }

.if-search {
  flex: 1; min-width: 240px; display: flex; align-items: center; gap: 10px; padding: 0 16px;
  height: 46px; background: var(--surface); border: 1px solid var(--border-input); border-radius: 10px;
  color: var(--text-faint); box-shadow: var(--shadow-card); transition: border-color 150ms ease, box-shadow 150ms ease;
}
.if-search:focus-within { border-color: var(--focus-ring); box-shadow: 0 0 0 3px var(--focus-ring-shadow); }
.if-search input {
  flex: 1; border: 0; outline: 0; background: none; font-size: 13.5px; color: var(--text-secondary); font-family: var(--font-display);
}
.if-search input::placeholder { color: var(--text-faint); }
.if-search-clear { border: 0; background: none; color: var(--text-faint); cursor: pointer; display: flex; padding: 4px; border-radius: 50%; }
.if-search-clear:hover { background: var(--surface-hover); color: var(--navy); }

.if-year-select {
  position: relative; height: 46px; background: var(--surface); border: 1px solid var(--border-input);
  border-radius: 10px; box-shadow: var(--shadow-card); min-width: 150px;
}
.if-year-select select {
  width: 100%; height: 100%; padding: 0 36px 0 16px; border: 0; background: none; appearance: none;
  -webkit-appearance: none; font-size: 13.5px; color: var(--text-secondary); font-family: var(--font-display); cursor: pointer; outline: 0;
}
.if-year-select svg { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--text-faint); pointer-events: none; }

.if-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

.if-card {
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 14px; padding: 22px;
  box-shadow: 0 6px 18px rgba(16, 42, 78, 0.05); position: relative; overflow: hidden;
  transition: transform 200ms cubic-bezier(.22,.8,.24,1), box-shadow 200ms ease, border-color 200ms ease;
}
[data-theme='dark'] .if-card { box-shadow: 0 6px 18px rgba(0,0,0,.28); }
.if-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--yellow), var(--navy));
  transform: scaleX(0); transform-origin: left; transition: transform 260ms ease;
}
.if-card:hover { transform: translateY(-4px); border-color: var(--action-border); box-shadow: 0 18px 34px rgba(16,42,78,.12); }
[data-theme='dark'] .if-card:hover { box-shadow: 0 18px 34px rgba(0,0,0,.45); }
.if-card:hover::before { transform: scaleX(1); }

.if-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }

.if-badge-year {
  display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 999px;
  font-family: var(--font-display); font-size: 11px; font-weight: 800;
  color: var(--accent-amber-deep); background: var(--amber-tint); border: 1px solid var(--amber-line);
}

.if-card-actions { display: flex; gap: 6px; opacity: 0; transform: translateY(-3px); transition: opacity 180ms ease, transform 180ms ease; }
.if-card:hover .if-card-actions,
.if-card:focus-within .if-card-actions { opacity: 1; transform: translateY(0); }
@media (hover: none) { .if-card-actions { opacity: 1; transform: none; } }

.if-icon-btn {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  color: var(--navy); background: var(--bg-soft); border: 1px solid var(--action-border); border-radius: 8px;
  cursor: pointer; text-decoration: none; transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}
.if-icon-btn:hover { color: var(--navy-deep); background: var(--surface-hover); border-color: var(--navy); }
.if-icon-btn-danger { color: var(--danger); border-color: var(--danger-outline); }
.if-icon-btn-danger:hover { color: var(--danger-strong); background: var(--danger-bg); border-color: var(--danger); }
.if-icon-btn:disabled { cursor: wait; opacity: .6; }

.if-mini-spinner { width: 12px; height: 12px; border: 2px solid var(--danger-line); border-top-color: var(--danger); border-radius: 50%; animation: if-spin .7s linear infinite; }

.if-card-title { font-family: var(--font-display); font-size: 17px; font-weight: 750; color: var(--navy-deep); margin: 0 0 10px; line-height: 1.35; }

.if-card-innovator { display: flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 12.5px; font-weight: 600; margin-bottom: 12px; }
.if-card-innovator svg { color: var(--text-faint); flex: none; }

.if-badge-type {
  display: inline-flex; padding: 4px 11px; border-radius: 999px; font-size: 10.5px; font-weight: 800; text-transform: uppercase;
  color: var(--info); background: var(--info-bg); border: 1px solid var(--info-line); margin-bottom: 12px;
}

.if-card-affair { display: flex; align-items: center; gap: 7px; color: var(--text-faint); font-size: 12px; margin-bottom: 16px; }
.if-card-affair svg { flex: none; }

.if-card-footer { display: flex; gap: 14px; flex-wrap: wrap; padding-top: 14px; border-top: 1px dashed var(--border-soft); }

.if-file-link { display: inline-flex; align-items: center; gap: 6px; color: var(--navy); font-size: 12px; font-weight: 700; text-decoration: none; }
.if-file-link:hover { color: var(--link-hover); text-decoration: underline; }
.if-file-empty { color: var(--text-faint); font-size: 12px; font-style: italic; }

.if-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 70px 20px; text-align: center;
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 14px; color: var(--muted);
}
.if-empty-icon {
  width: 60px; height: 60px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center;
  justify-content: center; color: var(--navy); margin-bottom: 8px;
}
.if-empty h3 { margin: 0; color: var(--text-secondary); font-size: 16px; }
.if-empty p { margin: 0; font-size: 13px; }

.if-skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.if-skeleton-card {
  height: 210px; border-radius: 14px;
  background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border-soft) 37%, var(--surface-hover) 63%);
  background-size: 400% 100%; animation: if-shimmer 1.4s ease infinite;
}

@keyframes if-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
@keyframes if-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .if-card { transition-duration: 1ms; }
  .if-card:hover { transform: none; }
  .if-card-actions { opacity: 1; transform: none; }
  .if-skeleton-card { animation-duration: 1600ms; }
}

@media (max-width: 860px) {
  .if-hero { padding: 26px 20px 32px; }
  .if-container { padding: 0 20px; }
  .if-grid, .if-skeleton-grid { grid-template-columns: 1fr; }
}
`

export default InovasiInfoPage