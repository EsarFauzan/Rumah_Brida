import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Eye, FileText, Pencil, Search, Trash2, X } from 'lucide-react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import Pagination from '../components/Pagination'
import DeleteProposalModal from '../components/DeleteProposalModal'
import ServicePageHeader from '../components/ServicePageHeader'
import FilterSummary from '../components/FilterSummary'
import PdfPreviewLink from '../components/PdfPreviewLink'

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ProposalTable({ proposals, pagination, isDraft = false, deletingId, onDelete }) {
  return (
    <div className="research-results-table-wrap">
      <table className={`research-results-table responsive-records${isDraft ? ' is-draft-table' : ''}`} role="table" aria-label={isDraft ? 'Daftar draft proposal riset' : 'Daftar proposal riset terkirim'}>
        <thead role="rowgroup">
          <tr role="row">
            <th className="research-table-number" scope="col">No</th>
            <th scope="col">Judul Proposal</th>
            <th scope="col">Peneliti &amp; Institusi</th>
            <th className="research-table-action" scope="col">Action</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {proposals.map((proposal, index) => {
            const rowNumber = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 10) + index + 1
            return (
              <tr key={proposal.id} role="row">
                <td role="cell" className="research-table-number-cell">{rowNumber}</td>
                <td role="cell"><strong className="research-table-title">{proposal.proposal_title || 'Proposal tanpa judul'}</strong></td>
                <td role="cell" data-label="Peneliti & institusi">
                  <strong className="research-table-researcher">{proposal.researcher_name || 'Nama peneliti belum diisi'}</strong>
                  <span className="research-table-institution">{proposal.institution || 'Institusi belum diisi'}</span>
                  {isDraft && <span className="research-table-institution">Disimpan {formatDate(proposal.updated_at)}</span>}
                </td>
                <td role="cell" data-label="Berkas & tindakan">
                  <div className="research-table-actions">
                    {proposal.pdf_url ? (
                      <PdfPreviewLink className="research-table-file" href={proposal.pdf_url} filename={proposal.pdf_original_name || `${proposal.proposal_title || 'proposal'}.pdf`}>
                        <FileText size={13} aria-hidden="true" /> PDF
                      </PdfPreviewLink>
                    ) : (
                      <span className="research-table-file is-disabled" aria-disabled="true">
                        <FileText size={13} aria-hidden="true" /> PDF
                      </span>
                    )}
                    {isDraft && (
                      <a className="research-table-icon-button" href={`/riset/hasil/${proposal.id}`} aria-label={`Detail ${proposal.proposal_title || 'proposal'}`} title="Detail">
                        <Eye size={15} aria-hidden="true" />
                      </a>
                    )}
                    {proposal.can_manage && (
                      <a
                        className="research-table-icon-button"
                        href={`/riset/proposal/${proposal.id}/edit`}
                        aria-label={`Edit ${proposal.proposal_title || 'proposal'}`}
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
                        aria-label={`Hapus ${proposal.proposal_title || 'proposal'}`}
                        title="Hapus"
                        onClick={() => onDelete(proposal)}
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
  )
}

function ResearchResultsPage() {
  const [successMessage, setSuccessMessage] = useState(() => window.history.state?.researchSuccess ?? '')
  const [proposals, setProposals] = useState([])
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDraftLoading, setIsDraftLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftError, setDraftError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [proposalToDelete, setProposalToDelete] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [draftPagination, setDraftPagination] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [draftPage, setDraftPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [reload, setReload] = useState(0)
  const { token, isAuthenticated } = useAuth()
  const draftsSectionRef = useRef(null)

  useEffect(() => {
    if (!successMessage) return undefined

    const currentState = window.history.state
    if (currentState?.researchSuccess) {
      const state = { ...currentState }
      delete state.researchSuccess
      window.history.replaceState(state, '')
    }

    const timer = window.setTimeout(() => setSuccessMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      api.get('/research-proposals', {
        params: { status: 'submitted', page, search: searchTerm.trim() || undefined },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (page > data.pagination.last_page) {
            setPage(Math.max(data.pagination.last_page, 1))
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

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsDraftLoading(true)
      setDraftError('')
      api.get('/research-proposals', {
        params: { status: 'draft', page: draftPage, search: searchTerm.trim() || undefined },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (draftPage > data.pagination.last_page) {
            setDraftPage(Math.max(data.pagination.last_page, 1))
            return
          }
          setDrafts(data.data)
          setDraftPagination(data.pagination)
        })
        .catch((requestError) => {
          if (!controller.signal.aborted) {
            setDrafts([])
            setDraftPagination(null)
            setDraftError(requestError.response?.status === 401
              ? 'Sesi Anda berakhir. Silakan masuk kembali untuk melihat draft.'
              : 'Draft belum dapat dimuat. Pastikan backend Laravel sedang berjalan.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsDraftLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [draftPage, isAuthenticated, reload, searchTerm, token])

  useEffect(() => {
    if (window.location.hash !== '#draft' || isDraftLoading) return undefined
    const timer = window.setTimeout(() => draftsSectionRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    }), 0)
    return () => window.clearTimeout(timer)
  }, [isDraftLoading])

  const deleteProposal = async (proposal) => {
    if (deletingId !== null) return

    setDeletingId(proposal.id)
    setActionError('')

    try {
      await api.delete(`/research-proposals/${proposal.id}`)
      setProposalToDelete(null)
      setReload((value) => value + 1)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setActionError('Sesi Anda berakhir. Silakan masuk kembali sebelum menghapus proposal.')
      } else if (requestError.response?.status === 403) {
        setActionError('Anda tidak berhak menghapus proposal ini.')
      } else {
        setActionError('Proposal gagal dihapus. Silakan coba kembali.')
      }
      setProposalToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const resetSearch = () => {
    setIsLoading(true)
    setIsDraftLoading(isAuthenticated)
    setSearchTerm('')
    setPage(1)
    setDraftPage(1)
  }

  return (
    <section className="research-results-page research-results-page-modern">
      <ServicePageHeader section="Riset" title="Hasil Riset" description="Kelola draft dan pantau proposal riset yang sudah dikirim." total={total} totalLabel="terkirim" action={<a className="primary-form-link" href={isAuthenticated ? '/riset/proposal' : '/masuk'}>{isAuthenticated ? 'Ajukan Proposal' : 'Masuk untuk Mengajukan'}</a>} />

      <div className="research-results-container">
        {successMessage && (
          <div className="research-success-toast" role="status" aria-live="polite">
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}
        <div className="research-results-toolbar">
          <label className="research-results-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari judul, peneliti, atau institusi..."
              aria-label="Cari proposal riset"
              onChange={(event) => {
                setIsLoading(true)
                setIsDraftLoading(isAuthenticated)
                setSearchTerm(event.target.value)
                setPage(1)
                setDraftPage(1)
              }}
            />
            {searchTerm && (
              <button type="button" aria-label="Hapus pencarian" onClick={resetSearch}>
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </label>
        </div>
        <FilterSummary count={pagination?.total} noun="proposal terkirim" loading={isLoading} error={error} search={searchTerm}
          onSearchClear={resetSearch} onReset={resetSearch} />

        {actionError && <div className="results-state is-error" role="alert">{actionError}</div>}

        {isAuthenticated && (
          <section className="research-results-section" id="draft" ref={draftsSectionRef} aria-labelledby="research-drafts-title">
            <header className="research-results-section-heading">
              <div className="research-results-section-title">
                <h2 id="research-drafts-title">Draft Proposal</h2>
                <span className="research-proposal-status is-draft">Draft</span>
                <p>Proposal yang belum dikirim dan dapat dilanjutkan.</p>
              </div>
              <span>{draftPagination?.total ?? 0} draft</span>
            </header>
            {draftError && <div className="results-state is-error" role="alert">{draftError}</div>}
            {isDraftLoading ? (
              <div className="research-results-loading" aria-label="Memuat draft riset">{[1, 2, 3].map((row) => <span key={row} />)}</div>
            ) : !draftError && drafts.length === 0 ? (
              <div className="results-state">
                <strong>{searchTerm.trim() ? 'Draft tidak ditemukan' : 'Belum ada draft'}</strong>
                <span>{searchTerm.trim() ? 'Coba gunakan kata pencarian yang berbeda.' : 'Draft yang disimpan akan tampil di sini.'}</span>
              </div>
            ) : !draftError && (
              <ProposalTable proposals={drafts} pagination={draftPagination} isDraft deletingId={deletingId} onDelete={setProposalToDelete} />
            )}
            {!isDraftLoading && !draftError && <Pagination pagination={draftPagination} onPageChange={setDraftPage} />}
          </section>
        )}

        <section className="research-results-section" id="submitted" aria-labelledby="research-submitted-title">
          <header className="research-results-section-heading">
            <div className="research-results-section-title">
              <h2 id="research-submitted-title">Proposal Terkirim</h2>
              <span className="research-proposal-status">Terkirim</span>
              <p>Proposal riset yang sudah dikirim.</p>
            </div>
            <span>{total} terkirim</span>
          </header>
          {error && <div className="results-state is-error" role="alert">{error}</div>}
          {isLoading ? (
            <div className="research-results-loading" aria-label="Memuat data hasil riset">
              {[1, 2, 3, 4].map((row) => <span key={row} />)}
            </div>
          ) : !error && proposals.length === 0 ? (
            <div className="results-state">
              <strong>{searchTerm.trim() ? 'Proposal terkirim tidak ditemukan' : 'Belum ada proposal yang dikirim'}</strong>
              <span>{searchTerm.trim() ? 'Coba gunakan kata pencarian yang berbeda.' : 'Proposal baru akan tampil di sini setelah dikirim.'}</span>
            </div>
          ) : !error && (
            <ProposalTable proposals={proposals} pagination={pagination} deletingId={deletingId} onDelete={setProposalToDelete} />
          )}
          {!isLoading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
        </section>
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
