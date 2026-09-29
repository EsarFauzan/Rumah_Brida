import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import Pagination from '../components/Pagination'
import api from '../services/api'
import { PublicFileLink, publicInformationStyles } from './PublicInformationPage'
import ServicePageHeader from '../components/ServicePageHeader'
import FilterSummary from '../components/FilterSummary'

function PublicResearchResultsPage() {
  const [proposals, setProposals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      api.get('/research-proposals', {
        params: {
          status: 'submitted',
          page,
          search: searchTerm.trim() || undefined,
        },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (page > data.pagination.last_page) {
            setPage(data.pagination.last_page)
            return
          }
          setProposals(data.data)
          setPagination(data.pagination)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setProposals([])
            setPagination(null)
            setError('Data hasil riset belum dapat dimuat.')
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
  }, [page, searchTerm])

  const changePage = (nextPage) => {
    setIsLoading(true)
    setPage(nextPage)
  }

  return (
    <section className="public-info-page">
      <style>{publicInformationStyles}</style>

      <ServicePageHeader section="Info Publik" title="Hasil Riset" description="Pengajuan riset dan berkas pelaporan yang dapat diakses publik." />

      <div className="public-info-container public-research-container">
        <div className="public-info-toolbar">
          <label className="public-info-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari judul, peneliti, atau institusi..."
              aria-label="Cari hasil riset"
              onChange={(event) => {
                setIsLoading(true)
                setSearchTerm(event.target.value)
                setPage(1)
              }}
            />
            {searchTerm && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => { setIsLoading(true); setSearchTerm(''); setPage(1) }}>
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </label>
        </div>

        <FilterSummary count={pagination?.total} noun="riset" loading={isLoading} error={error} search={searchTerm}
          onSearchClear={() => { setIsLoading(true); setSearchTerm(''); setPage(1) }} onReset={() => { setIsLoading(true); setSearchTerm(''); setPage(1) }} />
        {error ? (
          <div className="public-info-state" role="alert">{error}</div>
        ) : isLoading ? (
          <div className="public-info-loading" aria-label="Memuat hasil riset">
            {[1, 2, 3, 4].map((row) => <span key={row} />)}
          </div>
        ) : proposals.length === 0 ? (
          <div className="public-info-state">
            <strong>{searchTerm.trim() ? 'Hasil riset tidak ditemukan' : 'Belum ada hasil riset'}</strong>
            <span>{searchTerm.trim() ? 'Coba gunakan kata pencarian yang berbeda.' : 'Proposal yang telah dikirim akan tampil di halaman ini.'}</span>
          </div>
        ) : (
          <div className="public-info-table-wrap">
            <table className="public-info-table public-research-table responsive-records" role="table" aria-label="Hasil riset publik">
              <thead role="rowgroup">
                <tr role="row">
                  <th className="public-info-number" scope="col">No</th>
                  <th scope="col">Judul Proposal</th>
                  <th scope="col">Peneliti &amp; Institusi</th>
                  <th className="public-info-file-column" scope="col">Berkas Pelaporan</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {proposals.map((proposal, index) => {
                  const number = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 10) + index + 1
                  return (
                    <tr key={proposal.id} role="row">
                      <td role="cell" className="public-info-number-cell">{number}</td>
                      <td role="cell"><strong>{proposal.proposal_title}</strong></td>
                      <td role="cell" data-label="Peneliti & institusi">
                        <strong>{proposal.researcher_name}</strong>
                        <span className="public-research-institution">{proposal.institution}</span>
                      </td>
                      <td role="cell" data-label="Berkas pelaporan"><PublicFileLink path={proposal.pdf_url} filename={proposal.pdf_original_name || `${proposal.proposal_title}.pdf`} label="Lihat berkas" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && <Pagination pagination={pagination} onPageChange={changePage} />}
      </div>
    </section>
  )
}

export default PublicResearchResultsPage
