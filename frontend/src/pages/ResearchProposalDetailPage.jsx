import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function ResearchProposalDetailPage({ proposalId }) {
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    api.get(`/research-proposals/${proposalId}`)
      .then((response) => {
        setProposal(response.data.data)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.status === 403
          ? 'Proposal ini masih berstatus draft dan hanya dapat dilihat pemiliknya.'
          : 'Detail proposal tidak dapat dimuat.')
      })
      .finally(() => setIsLoading(false))
  }, [proposalId, token])

  const deleteProposal = async () => {
    if (!window.confirm(`Hapus proposal "${proposal.proposal_title}"? Data dan file PDF tidak dapat dikembalikan.`)) return

    setIsDeleting(true)
    setError('')

    try {
      await api.delete(`/research-proposals/${proposalId}`)
      window.history.pushState({}, '', '/riset/hasil')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setError('Sesi Anda berakhir. Silakan masuk kembali sebelum menghapus proposal.')
      } else if (requestError.response?.status === 403) {
        setError('Anda tidak berhak menghapus proposal ini.')
      } else {
        setError('Proposal gagal dihapus. Silakan coba kembali.')
      }
      setIsDeleting(false)
    }
  }

  if (isLoading) return <section className="proposal-detail-page"><div className="container results-state">Memuat detail proposal...</div></section>
  if (error && !proposal) return <section className="proposal-detail-page"><div className="container results-state is-error">{error}</div></section>

  return (
    <section className="proposal-detail-page">
      <div className="proposal-detail-container">
        <nav className="proposal-detail-breadcrumb" aria-label="Breadcrumb">
          <a href="/riset/hasil">Hasil Riset</a><span>/</span><span>Detail Proposal</span>
        </nav>

        <header className="proposal-detail-header">
          <div>
            <span className="result-status">{proposal.status === 'submitted' ? 'Diajukan' : 'Draft'}</span>
            <h1>{proposal.proposal_title || 'Proposal tanpa judul'}</h1>
            <p>Dikirim {formatDate(proposal.submitted_at || proposal.created_at)}</p>
          </div>
          <div className="proposal-detail-actions">
            {proposal.can_manage && <a href={`/riset/proposal/${proposal.id}/edit`}>Edit Proposal</a>}
            {proposal.pdf_url && <a href={proposal.pdf_url} target="_blank" rel="noreferrer">Lihat PDF</a>}
            {proposal.can_manage && (
              <button type="button" disabled={isDeleting} onClick={deleteProposal}>{isDeleting ? 'Menghapus...' : 'Hapus'}</button>
            )}
          </div>
        </header>

        {error && <div className="form-feedback error">{error}</div>}

        <div className="proposal-overview">
          <div><span>Nama Peneliti</span><strong>{proposal.researcher_name || '-'}</strong></div>
          <div><span>Asal Universitas/PT</span><strong>{proposal.institution || '-'}</strong></div>
          <div><span>Koordinat Penelitian</span><strong>{proposal.research_coordinates || '-'}</strong></div>
          <div><span>Nama File</span><strong>{proposal.pdf_original_name || '-'}</strong></div>
        </div>

        <div className="proposal-chapters">
          <section><span>BAB I</span><h2>Pendahuluan, Permasalahan, Tujuan</h2><p>{proposal.chapter_one || '-'}</p></section>
          <section><span>BAB II</span><h2>Rancang Bangun / Ringkasan</h2><p>{proposal.chapter_two || '-'}</p></section>
          <section><span>BAB III</span><h2>Hasil yang Dituju</h2><p>{proposal.chapter_three || '-'}</p></section>
        </div>
      </div>
    </section>
  )
}

export default ResearchProposalDetailPage
