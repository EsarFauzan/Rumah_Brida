import { useEffect, useState } from 'react'
import { storageUrl } from '../utils/fileUrl'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'

function InovasiInfoPage() {
  const [innovations, setInnovations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [total, setTotal] = useState(0)
  const [availableYears, setAvailableYears] = useState([])
  const [reload, setReload] = useState(0)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setFeedback(null)
      api.get('/innovations', {
        params: { page, search: searchTerm.trim() || undefined, year: yearFilter === 'all' ? undefined : yearFilter },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (page > data.data.last_page) {
            setPage(data.data.last_page)
            return
          }
          setInnovations(data.data.data)
          setPagination(data.data)
          setTotal(data.total)
          setAvailableYears(data.years)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setPagination(null)
            setInnovations([])
            setFeedback({ type: 'error', message: 'Gagal memuat data inovasi.' })
          }
        })
        .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [page, searchTerm, yearFilter, reload])

  const confirmDelete = async () => {
    if (!pendingDelete || deletingId !== null) return

    setDeletingId(pendingDelete.id)
    try {
      await api.delete(`/innovations/${pendingDelete.id}`)
      setReload((value) => value + 1)
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
            <div className="if-stat-value">{total}</div>
            <div className="if-stat-label">Total Inovasi</div>
          </div>
        </div>
      </div>

      <div className="if-container">
        {feedback && <div className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</div>}

        {(
          <div className="if-toolbar">
            <div className="if-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari judul atau nama inovator..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                aria-label="Cari judul atau nama inovator"
              />
              {searchTerm && (
                <button type="button" className="if-search-clear" aria-label="Hapus pencarian" onClick={() => { setSearchTerm(''); setPage(1) }}>
                  <XIcon />
                </button>
              )}
            </div>
            <div className="if-year-select">
              <select aria-label="Tahun pelaporan" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1) }}>
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
          <div className="if-table-loading" aria-label="Memuat data inovasi">
            {[1, 2, 3, 4].map((n) => (
              <div className="if-skeleton-row" key={n} />
            ))}
          </div>
        ) : feedback ? null : total === 0 ? (
          <div className="if-empty">
            <div className="if-empty-icon"><EmptyIcon /></div>
            <h3>Belum Ada Data Inovasi</h3>
            <p>Data inovasi yang ditambahkan akan muncul di sini.</p>
          </div>
        ) : innovations.length === 0 ? (
          <div className="if-empty">
            <div className="if-empty-icon"><SearchIcon size={32} /></div>
            <h3>Tidak Ditemukan</h3>
            <p>Coba ubah kata kunci pencarian atau filter tahun.</p>
          </div>
        ) : (
          <div className="if-table-wrap">
            <table className="if-table">
              <thead>
                <tr>
                  <th className="if-col-number" scope="col">NO</th>
                  <th scope="col">Judul</th>
                  <th scope="col">OPD</th>
                  <th className="if-col-action" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {innovations.map((item, index) => {
                  const isOwner = isAuthenticated && user?.id === item.user_id
                  const rowNumber = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 10) + index + 1
                  return (
                    <tr key={item.id}>
                      <td className="if-cell-number">{rowNumber}</td>
                      <td>
                        <strong className="if-table-title">{item.title}</strong>
                      </td>
                      <td>
                        <span className={item.regional_agency ? 'if-table-opd' : 'if-table-empty'}>
                          {item.regional_agency || 'Belum diisi'}
                        </span>
                      </td>
                      <td>
                        <div className="if-table-actions">
                          <InnovationFileAction path={item.profile_pdf_path} label="Profil" />
                          <InnovationFileAction path={item.report_pdf_path} label="Laporan" />
                          {isOwner && (
                            <>
                              <a className="if-icon-btn" href={`/inovasi/edit/${item.id}`} aria-label={`Edit ${item.title}`} title="Edit">
                                <EditIcon />
                              </a>
                              <button
                                type="button"
                                className="if-icon-btn if-icon-btn-danger"
                                onClick={() => setPendingDelete(item)}
                                disabled={deletingId === item.id}
                                aria-label={`Hapus ${item.title}`}
                                title="Hapus"
                              >
                                {deletingId === item.id ? <span className="if-mini-spinner" /> : <TrashIcon />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !feedback && <Pagination pagination={pagination} onPageChange={setPage} />}
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

function InnovationFileAction({ path, label }) {
  if (!path) {
    return (
      <span className="if-file-link is-unavailable" aria-disabled="true" title={`${label} belum tersedia`}>
        <FileIcon /> {label}
      </span>
    )
  }

  return (
    <a className="if-file-link is-available" href={storageUrl(path)} target="_blank" rel="noopener noreferrer">
      <FileIcon /> {label}
    </a>
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

.if-table-wrap {
  width: 100%; overflow-x: auto; background: var(--surface); border: 1px solid var(--border-strong);
  border-radius: 12px; box-shadow: var(--shadow-card);
}
.if-table { width: 100%; min-width: 720px; border-collapse: collapse; table-layout: fixed; }
.if-table th {
  padding: 15px 18px; color: var(--text-secondary); background: var(--bg-soft); border-bottom: 1px solid var(--border-strong);
  font-family: var(--font-display); font-size: 12px; font-weight: 800; text-align: left; text-transform: uppercase;
}
.if-table td { padding: 17px 18px; color: var(--text-secondary); border-bottom: 1px solid var(--border-soft); font-size: 13px; vertical-align: middle; }
.if-table tbody tr:last-child td { border-bottom: 0; }
.if-table tbody tr { transition: background-color 160ms ease; }
.if-table tbody tr:hover { background: var(--surface-hover); }
.if-col-number { width: 72px; text-align: center !important; }
.if-col-action { width: 290px; }
.if-cell-number { color: var(--navy) !important; font-family: var(--font-display); font-weight: 800; text-align: center; }
.if-table-title { display: block; color: var(--navy-deep); font-family: var(--font-display); font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
.if-table-opd { color: var(--text-secondary); font-weight: 600; overflow-wrap: anywhere; }
.if-table-empty { color: var(--text-faint); font-size: 12px; font-style: italic; }
.if-table-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

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

.if-file-link { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 10px; color: var(--navy); background: var(--bg-soft); border: 1px solid var(--action-border); border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.if-file-link.is-available { transition: color 160ms ease, background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease; }
.if-file-link.is-available:hover,
.if-file-link.is-available:focus-visible { color: var(--navy-deep); background: linear-gradient(135deg, var(--yellow), color-mix(in srgb, var(--yellow) 72%, #fff)); border-color: var(--yellow); box-shadow: 0 6px 16px color-mix(in srgb, var(--yellow) 32%, transparent); outline: none; transform: translateY(-1px); }
.if-file-link.is-unavailable { color: var(--text-faint); background: var(--bg-soft); border-color: var(--border-input); cursor: not-allowed; opacity: .78; }

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

.if-table-loading { display: grid; gap: 1px; overflow: hidden; border: 1px solid var(--border-strong); border-radius: 12px; background: var(--border-soft); }
.if-skeleton-row {
  height: 68px;
  background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border-soft) 37%, var(--surface-hover) 63%);
  background-size: 400% 100%; animation: if-shimmer 1.4s ease infinite;
}

@keyframes if-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
@keyframes if-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .if-table tbody tr { transition-duration: 1ms; }
  .if-file-link.is-available { transition-duration: 1ms; }
  .if-file-link.is-available:hover,
  .if-file-link.is-available:focus-visible { transform: none; }
  .if-skeleton-row { animation-duration: 1600ms; }
}

@media (max-width: 860px) {
  .if-hero { padding: 26px 20px 32px; }
  .if-container { padding: 0 20px; }
  .if-table th, .if-table td { padding: 14px; }
}
`

export default InovasiInfoPage
