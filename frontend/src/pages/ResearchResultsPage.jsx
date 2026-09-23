import { useEffect, useState } from 'react'
import { FileText, Pencil, Search, Trash2, X } from 'lucide-react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import Pagination from '../components/Pagination'
import DeleteProposalModal from '../components/DeleteProposalModal'

function ResearchResultsPage() {
  const [proposals, setProposals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [proposalToDelete, setProposalToDelete] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [reload, setReload] = useState(0)
  const { token, isAuthenticated } = useAuth()

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
          if (!searchTerm.trim()) setTotal(data.pagination.total)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setProposals([])
            setPagination(null)
            setError('Data hasil riset belum dapat dimuat. Pastikan backend Laravel sedang berjalan.')
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
  }, [page, reload, searchTerm, token])

  const deleteProposal = async (proposal) => {
    if (deletingId !== null) return

    setDeletingId(proposal.id)
    setError('')

    try {
      await api.delete(`/research-proposals/${proposal.id}`)
      setProposalToDelete(null)
      setReload((value) => value + 1)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setError('Sesi Anda berakhir. Silakan masuk kembali sebelum menghapus proposal.')
      } else if (requestError.response?.status === 403) {
        setError('Anda tidak berhak menghapus proposal ini.')
      } else {
        setError('Proposal gagal dihapus. Silakan coba kembali.')
      }
      setProposalToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="research-results-page research-results-page-modern">
      <div className="research-results-hero">
        <div className="research-results-hero-inner">
          <div>
            <div className="research-results-crumb">
              Riset <span /> <b>Hasil Riset</b>
            </div>
            <h1>Hasil Riset</h1>
            <p>Daftar proposal riset yang telah dikirim oleh para peneliti.</p>
          </div>
          <div className="research-results-stat">
            <strong>{total}</strong>
            <span>Total Riset</span>
          </div>
        </div>
      </div>

      <div className="research-results-container">
        <div className="research-results-toolbar">
          <label className="research-results-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari judul, peneliti, atau institusi..."
              aria-label="Cari hasil riset"
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
          <a className="research-results-submit" href={isAuthenticated ? '/riset/proposal' : '/masuk'}>
            {isAuthenticated ? 'Ajukan Proposal' : 'Masuk untuk Mengajukan'}
          </a>
        </div>

        {error && <div className="results-state is-error" role="alert">{error}</div>}
        {isLoading ? (
          <div className="research-results-loading" aria-label="Memuat data hasil riset">
            {[1, 2, 3, 4].map((row) => <span key={row} />)}
          </div>
        ) : !error && proposals.length === 0 ? (
          <div className="results-state">
            <strong>{searchTerm.trim() ? 'Hasil riset tidak ditemukan' : 'Belum ada proposal yang dikirim'}</strong>
            <span>{searchTerm.trim() ? 'Coba gunakan kata pencarian yang berbeda.' : 'Proposal baru akan tampil di halaman ini setelah dikirim.'}</span>
          </div>
        ) : !error && (
          <div className="research-results-table-wrap">
            <table className="research-results-table">
              <thead>
                <tr>
                  <th className="research-table-number" scope="col">No</th>
                  <th scope="col">Judul Proposal</th>
                  <th scope="col">Peneliti &amp; Institusi</th>
                  <th className="research-table-action" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal, index) => {
                  const rowNumber = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 10) + index + 1
                  return (
                    <tr key={proposal.id}>
                      <td className="research-table-number-cell">{rowNumber}</td>
                      <td><strong className="research-table-title">{proposal.proposal_title}</strong></td>
                      <td>
                        <strong className="research-table-researcher">{proposal.researcher_name}</strong>
                        <span className="research-table-institution">{proposal.institution}</span>
                      </td>
                      <td>
                        <div className="research-table-actions">
                          {proposal.pdf_url ? (
                            <a className="research-table-file" href={proposal.pdf_url} target="_blank" rel="noreferrer">
                              <FileText size={13} aria-hidden="true" /> PDF
                            </a>
                          ) : (
                            <span className="research-table-file is-disabled" aria-disabled="true">
                              <FileText size={13} aria-hidden="true" /> PDF
                            </span>
                          )}
                          {proposal.can_manage && (
                            <a
                              className="research-table-icon-button"
                              href={`/riset/proposal/${proposal.id}/edit`}
                              aria-label={`Edit ${proposal.proposal_title}`}
                              title="Edit"
                            >
                              <Pencil size={15} aria-hidden="true" />
                            </a>
                          )}
                          {proposal.can_manage && (
                            <button
                              className="research-table-icon-button is-danger"
                              type="button"
                              disabled={deletingId === proposal.id}
                              aria-label={`Hapus ${proposal.proposal_title}`}
                              title="Hapus"
                              onClick={() => setProposalToDelete(proposal)}
                            >
                              {deletingId === proposal.id ? <span className="research-table-spinner" /> : <Trash2 size={15} aria-hidden="true" />}
                            </button>
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

        {!isLoading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      <DeleteProposalModal
        open={proposalToDelete !== null}
        proposalTitle={proposalToDelete?.proposal_title}
        isDeleting={deletingId !== null}
        onCancel={() => setProposalToDelete(null)}
        onConfirm={() => deleteProposal(proposalToDelete)}
      />
    </section>
  )
}

export default ResearchResultsPage
