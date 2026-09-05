import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

function ResearchResultsPage() {
  const [proposals, setProposals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    let isMounted = true

    api.get('/research-proposals?status=submitted')
      .then((response) => {
        if (!isMounted) return
        setProposals(response.data.data)
        setError('')
      })
      .catch(() => {
        if (isMounted) setError('Data hasil riset belum dapat dimuat. Pastikan backend Laravel sedang berjalan.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [token])

  const deleteProposal = async (proposal) => {
    const confirmed = window.confirm(`Hapus proposal "${proposal.proposal_title}"? Data dan file PDF tidak dapat dikembalikan.`)
    if (!confirmed) return

    setDeletingId(proposal.id)
    setError('')

    try {
      await api.delete(`/research-proposals/${proposal.id}`)
      setProposals((current) => current.filter((item) => item.id !== proposal.id))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setError('Sesi Anda berakhir. Silakan masuk kembali sebelum menghapus proposal.')
      } else if (requestError.response?.status === 403) {
        setError('Anda tidak berhak menghapus proposal ini.')
      } else {
        setError('Proposal gagal dihapus. Silakan coba kembali.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="research-results-page">
      <div className="container">
        <header className="results-header">
          <div><p>Riset</p><h1>Hasil Riset</h1><span>Daftar proposal riset yang telah dikirim.</span></div>
          <a href={isAuthenticated ? '/riset/proposal' : '/masuk'}>{isAuthenticated ? 'Ajukan Proposal' : 'Masuk untuk Mengajukan'}</a>
        </header>

        {isLoading && <div className="results-state">Memuat data hasil riset...</div>}
        {error && <div className="results-state is-error">{error}</div>}
        {!isLoading && !error && proposals.length === 0 && (
          <div className="results-state"><strong>Belum ada proposal yang dikirim.</strong><span>Proposal baru akan tampil di halaman ini setelah dikirim.</span></div>
        )}

        {!isLoading && !error && proposals.length > 0 && (
          <div className="research-results-list">
            {proposals.map((proposal) => (
              <article className="research-result-item" key={proposal.id}>
                <div className="result-number">{String(proposal.id).padStart(2, '0')}</div>
                <div className="result-main">
                  <span className="result-status">Diajukan</span>
                  <h2>{proposal.proposal_title}</h2>
                  <p>{proposal.chapter_three}</p>
                  <div className="result-meta"><span>{proposal.researcher_name}</span><span>{proposal.institution}</span><span>{proposal.research_coordinates}</span></div>
                </div>
                <div className="result-actions">
                  <a className="result-action primary" href={`/riset/hasil/${proposal.id}`}>Detail</a>
                  {proposal.can_manage && <a className="result-action" href={`/riset/proposal/${proposal.id}/edit`}>Edit</a>}
                  {proposal.pdf_url && <a className="result-action" href={proposal.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
                  {proposal.can_manage && (
                    <button className="result-action danger" type="button" disabled={deletingId === proposal.id} onClick={() => deleteProposal(proposal)}>
                      {deletingId === proposal.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ResearchResultsPage
