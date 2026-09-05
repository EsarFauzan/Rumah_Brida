import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import Pagination from '../components/Pagination'

const filters = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua' },
]

const verificationLabels = {
  pending: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

function AdminResearchProposalsPage() {
  const { isAuthenticated, user, token } = useAuth()
  const [proposals, setProposals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewingId, setReviewingId] = useState(null)
  const [noteById, setNoteById] = useState({})

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return undefined
    let isMounted = true

    api.get(`/admin/research-proposals?verification_status=${filter}&page=${page}`)
      .then((response) => {
        if (!isMounted) return
        setProposals(response.data.data)
        setPagination(response.data.pagination)
        setError('')
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.response?.status === 403
          ? 'Akun ini tidak memiliki akses admin.'
          : 'Data proposal belum dapat dimuat.')
      })
      .finally(() => { if (isMounted) setIsLoading(false) })

    return () => { isMounted = false }
  }, [filter, isAuthenticated, page, token, user?.role])

  const reviewProposal = async (proposal, verificationStatus) => {
    const reviewNote = noteById[proposal.id]?.trim() ?? ''
    if (verificationStatus === 'rejected' && !reviewNote) {
      setError('Catatan admin wajib diisi saat menolak proposal.')
      return
    }

    setReviewingId(proposal.id)
    setError('')
    try {
      const response = await api.patch(`/admin/research-proposals/${proposal.id}/verification`, {
        verification_status: verificationStatus,
        review_note: reviewNote || null,
      })
      const updatedProposal = response.data.data
      setProposals((items) => (filter === 'all'
        ? items.map((item) => (item.id === proposal.id ? updatedProposal : item))
        : items.filter((item) => item.id !== proposal.id)))
      setNoteById((notes) => ({ ...notes, [proposal.id]: '' }))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Status proposal gagal diperbarui.')
    } finally {
      setReviewingId(null)
    }
  }

  if (!isAuthenticated) {
    return <section className="research-results-page"><div className="container results-state"><strong>Masuk sebagai admin untuk membuka dashboard.</strong><a className="primary-form-link" href="/masuk">Masuk</a></div></section>
  }

  if (user?.role !== 'admin') {
    return <section className="research-results-page"><div className="container results-state is-error">Akun ini tidak memiliki akses ke dashboard admin.</div></section>
  }

  return (
    <section className="research-results-page admin-proposals-page">
      <div className="container">
        <header className="results-header">
          <div><p>Admin</p><h1>Verifikasi Proposal</h1><span>Tinjau proposal riset yang sudah dikirim peneliti.</span></div>
        </header>
        <div className="admin-filter" aria-label="Filter status verifikasi">
          {filters.map((item) => <button className={filter === item.value ? 'is-active' : ''} key={item.value} type="button" onClick={() => { setFilter(item.value); setPage(1) }}>{item.label}</button>)}
        </div>
        {isLoading && <div className="results-state">Memuat proposal...</div>}
        {error && <div className="results-state is-error">{error}</div>}
        {!isLoading && !error && proposals.length === 0 && <div className="results-state"><strong>Tidak ada proposal pada filter ini.</strong></div>}
        {!isLoading && !error && proposals.length > 0 && <div className="research-results-list">
          {proposals.map((proposal) => (
            <article className="research-result-item admin-result-item" key={proposal.id}>
              <div className="result-number">{String(proposal.id).padStart(2, '0')}</div>
              <div className="result-main">
                <span className={`result-status is-${proposal.verification_status}`}>{verificationLabels[proposal.verification_status]}</span>
                <h2>{proposal.proposal_title}</h2>
                <div className="result-meta"><span>{proposal.researcher_name}</span><span>{proposal.institution}</span><span>{proposal.research_coordinates}</span></div>
                <textarea aria-label={`Catatan untuk ${proposal.proposal_title}`} value={noteById[proposal.id] ?? proposal.review_note ?? ''} maxLength="1000" placeholder="Catatan admin, wajib saat ditolak" onChange={(event) => setNoteById((notes) => ({ ...notes, [proposal.id]: event.target.value }))} />
                {proposal.review_note && <p className="review-note">Catatan admin: {proposal.review_note}</p>}
              </div>
              <div className="result-actions">
                <a className="result-action" href={`/riset/hasil/${proposal.id}`}>Detail</a>
                {proposal.pdf_url && <a className="result-action" href={proposal.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
                {proposal.verification_status !== 'approved' && (
                  <button className="result-action primary" type="button" disabled={reviewingId === proposal.id} onClick={() => reviewProposal(proposal, 'approved')}>Setujui</button>
                )}
                {proposal.verification_status !== 'rejected' && (
                  <button className="result-action danger" type="button" disabled={reviewingId === proposal.id} onClick={() => reviewProposal(proposal, 'rejected')}>Tolak</button>
                )}
                {proposal.verification_status !== 'pending' && (
                  <button className="result-action" type="button" disabled={reviewingId === proposal.id} onClick={() => reviewProposal(proposal, 'pending')}>Kembalikan Menunggu</button>
                )}
              </div>
            </article>
          ))}
        </div>}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </section>
  )
}

export default AdminResearchProposalsPage
