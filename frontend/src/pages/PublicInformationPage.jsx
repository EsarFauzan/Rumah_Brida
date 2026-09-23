import { useEffect, useState } from 'react'
import { ExternalLink, FileText, Search, X } from 'lucide-react'
import Pagination from '../components/Pagination'
import api from '../services/api'
import { storageUrl } from '../utils/fileUrl'

function PublicInformationPage() {
  const [innovations, setInnovations] = useState([])
  const [pagination, setPagination] = useState(null)
  const [availableYears, setAvailableYears] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      api.get('/innovations', {
        params: {
          page,
          search: searchTerm.trim() || undefined,
          year: yearFilter === 'all' ? undefined : yearFilter,
        },
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
          setAvailableYears(data.years)
          setTotal(data.total)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setInnovations([])
            setPagination(null)
            setError('Data informasi publik belum dapat dimuat.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [page, searchTerm, yearFilter])

  return (
    <section className="public-info-page">
      <style>{publicInformationStyles}</style>

      <div className="public-info-hero">
        <div className="public-info-hero-inner">
          <div>
            <p>Rumah BRIDA</p>
            <h1>Info Peneliti</h1>
            <span>Informasi inovasi daerah beserta dokumen publik dan laporan pelaksanaannya.</span>
          </div>
          <div className="public-info-total">
            <strong>{total}</strong>
            <span>Total Inovasi</span>
          </div>
        </div>
      </div>

      <div className="public-info-container">
        <div className="public-info-toolbar">
          <label className="public-info-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari judul inovasi..."
              aria-label="Cari judul inovasi"
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setPage(1)
              }}
            />
            {searchTerm && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearchTerm(''); setPage(1) }}>
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </label>

          <select
            className="public-info-year"
            value={yearFilter}
            aria-label="Filter tahun pelaporan"
            onChange={(event) => {
              setYearFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {error ? (
          <div className="public-info-state" role="alert">{error}</div>
        ) : isLoading ? (
          <div className="public-info-loading" aria-label="Memuat informasi publik">
            {[1, 2, 3, 4].map((row) => <span key={row} />)}
          </div>
        ) : innovations.length === 0 ? (
          <div className="public-info-state">
            <strong>{total === 0 ? 'Belum ada data inovasi' : 'Data tidak ditemukan'}</strong>
            <span>{total === 0 ? 'Data dari Input Inovasi akan tampil di halaman ini.' : 'Coba ubah pencarian atau filter tahun.'}</span>
          </div>
        ) : (
          <div className="public-info-table-wrap">
            <table className="public-info-table">
              <thead>
                <tr>
                  <th className="public-info-number" scope="col">No</th>
                  <th scope="col">Judul Inovasi</th>
                  <th scope="col">OPD</th>
                  <th className="public-info-file-column" scope="col">File Publik</th>
                  <th className="public-info-file-column" scope="col">File Laporan</th>
                </tr>
              </thead>
              <tbody>
                {innovations.map((innovation, index) => {
                  const number = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 10) + index + 1
                  return (
                    <tr key={innovation.id}>
                      <td className="public-info-number-cell">{number}</td>
                      <td><strong>{innovation.title}</strong></td>
                      <td>{innovation.regional_agency || <em>Belum diisi</em>}</td>
                      <td><PublicFileLink path={innovation.profile_pdf_path} label="Lihat file publik" /></td>
                      <td><PublicFileLink path={innovation.report_pdf_path} label="Lihat file laporan" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </section>
  )
}

export function PublicFileLink({ path, label }) {
  if (!path) return <span className="public-info-unavailable">Belum tersedia</span>
  const href = /^https?:\/\//i.test(path) ? path : storageUrl(path)

  return (
    <a className="public-info-file" href={href} target="_blank" rel="noopener noreferrer">
      <FileText size={15} aria-hidden="true" />
      <span>{label}</span>
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  )
}

export const publicInformationStyles = `
.public-info-page { min-height: 100vh; padding-bottom: 80px; background: var(--bg-soft); }
.public-info-hero { padding: 36px 40px 40px; color: #fff; background: linear-gradient(120deg, var(--navy-deep), var(--navy)); }
.public-info-hero-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.public-info-hero p { margin: 0 0 8px; color: var(--yellow); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.public-info-hero h1 { margin: 0 0 8px; font-size: 30px; }
.public-info-hero-inner > div > span { color: rgba(255,255,255,.78); font-size: 14px; }
.public-info-total { min-width: 120px; padding: 14px 24px; border-radius: 14px; background: rgba(255,255,255,.1); text-align: center; }
.public-info-total strong, .public-info-total span { display: block; }
.public-info-total strong { color: #fff; font-family: var(--font-display); font-size: 28px; line-height: 1; }
.public-info-total span { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.public-info-container { max-width: 1100px; margin: -20px auto 0; padding: 0 40px; position: relative; }
.public-info-toolbar { display: flex; gap: 14px; margin: 22px 0 26px; }
.public-info-search { height: 46px; flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 15px; color: var(--text-faint); background: var(--surface); border: 1px solid var(--border-input); border-radius: 10px; box-shadow: var(--shadow-card); }
.public-info-search:focus-within { border-color: var(--focus-ring); box-shadow: 0 0 0 3px var(--focus-ring-shadow); }
.public-info-search input { width: 100%; border: 0; outline: 0; color: var(--text-secondary); background: transparent; font: inherit; font-size: 13px; }
.public-info-search button { width: 28px; height: 28px; display: grid; place-items: center; padding: 0; color: var(--text-faint); background: transparent; border: 0; border-radius: 7px; cursor: pointer; }
.public-info-search button:hover { color: var(--navy); background: var(--surface-hover); }
.public-info-year { min-width: 150px; height: 46px; padding: 0 14px; color: var(--text-secondary); background: var(--surface); border: 1px solid var(--border-input); border-radius: 10px; box-shadow: var(--shadow-card); font: inherit; font-size: 13px; }
.public-info-table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 12px; box-shadow: var(--shadow-card); }
.public-info-table { width: 100%; min-width: 880px; border-collapse: collapse; table-layout: fixed; }
.public-info-table th { padding: 15px 18px; color: var(--text-secondary); background: var(--bg-soft); border-bottom: 1px solid var(--border-strong); font-family: var(--font-display); font-size: 12px; font-weight: 800; text-align: left; text-transform: uppercase; }
.public-info-table td { padding: 17px 18px; color: var(--text-secondary); border-bottom: 1px solid var(--border-soft); font-size: 13px; vertical-align: middle; overflow-wrap: anywhere; }
.public-info-table tbody tr:last-child td { border-bottom: 0; }
.public-info-table tbody tr { transition: background-color 160ms ease; }
.public-info-table tbody tr:hover { background: var(--surface-hover); }
.public-info-table td strong { color: var(--navy-deep); font-family: var(--font-display); font-size: 14px; line-height: 1.45; }
.public-research-institution { display: block; margin-top: 4px; color: var(--text-faint); font-size: 11px; }
.public-info-table td em { color: var(--text-faint); font-size: 12px; }
.public-info-number { width: 70px; text-align: center !important; }
.public-info-number-cell { color: var(--navy) !important; font-weight: 800; text-align: center; }
.public-info-file-column { width: 180px; }
.public-info-file { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 10px; color: var(--navy); background: var(--bg-soft); border: 1px solid var(--action-border); border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.public-info-file:hover { color: var(--link-hover); border-color: var(--yellow); background: var(--focus-tint); }
.public-info-unavailable { color: var(--text-faint); font-size: 12px; font-style: italic; }
.public-info-state { min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 30px; color: var(--muted); background: var(--surface); border: 1px solid var(--border-strong); border-radius: 12px; text-align: center; }
.public-info-state strong { color: var(--text-secondary); }
.public-info-loading { display: grid; gap: 1px; overflow: hidden; background: var(--border-soft); border: 1px solid var(--border-strong); border-radius: 12px; }
.public-info-loading span { height: 68px; background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border-soft) 37%, var(--surface-hover) 63%); background-size: 400% 100%; animation: public-info-shimmer 1.4s ease infinite; }
@keyframes public-info-shimmer { from { background-position: 100% 50%; } to { background-position: 0 50%; } }
@media (max-width: 760px) {
  .public-info-hero { padding: 26px 20px 32px; }
  .public-info-hero-inner { align-items: flex-start; flex-direction: column; }
  .public-info-container { padding: 0 20px; }
  .public-info-toolbar { flex-direction: column; }
  .public-info-year { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .public-info-table tbody tr { transition-duration: 1ms; }
  .public-info-loading span { animation: none; }
}
`

export default PublicInformationPage
