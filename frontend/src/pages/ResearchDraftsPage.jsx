import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import Pagination from '../components/Pagination'
import DeleteProposalModal from '../components/DeleteProposalModal'

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

function ResearchDraftsPage() {
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [draftToDelete, setDraftToDelete] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isMounted = true

    api.get(`/research-proposals?status=draft&page=${page}`)
      .then((response) => {
        if (!isMounted) return

        setDrafts(response.data.data)
        setPagination(response.data.pagination)
        setError('')
      })
      .catch((requestError) => {
        if (!isMounted) return

        setError(requestError.response?.status === 401
          ? 'Sesi Anda berakhir. Silakan masuk kembali untuk melihat draft.'
          : 'Draft belum dapat dimuat. Pastikan backend Laravel sedang berjalan.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [isAuthenticated, page, token])

  const deleteDraft = async (draft) => {
    if (deletingId !== null) return

    setDeletingId(draft.id)
    setError('')

    try {
      await api.delete(`/research-proposals/${draft.id}`)
      setDrafts((current) => current.filter((item) => item.id !== draft.id))
      setDraftToDelete(null)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setError('Sesi Anda berakhir. Silakan masuk kembali sebelum menghapus draft.')
      } else if (requestError.response?.status === 403) {
        setError('Anda tidak berhak menghapus draft ini.')
      } else {
        setError('Draft gagal dihapus. Silakan coba kembali.')
      }
      setDraftToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="research-results-page">
      <div className="container">
        <header className="results-header">
          <div>
            <p>Riset</p>
            <h1>Draft Saya</h1>
            <span>Proposal yang belum dikirim dari akun Anda.</span>
          </div>
          <a href={isAuthenticated ? '/riset/proposal' : '/masuk'}>{isAuthenticated ? 'Buat Proposal' : 'Masuk untuk Membuat Draft'}</a>
        </header>

        {!isAuthenticated && (
          <div className="results-state">
            <strong>Masuk untuk melihat draft.</strong>
            <span>Draft proposal hanya tersedia untuk akun yang membuatnya.</span>
            <a className="primary-form-link" href="/masuk">Masuk</a>
          </div>
        )}

        {isAuthenticated && isLoading && <div className="results-state">Memuat draft Anda...</div>}
        {isAuthenticated && error && <div className="results-state is-error">{error}</div>}
        {isAuthenticated && !isLoading && !error && drafts.length === 0 && (
          <div className="results-state">
            <strong>Belum ada draft.</strong>
            <span>Gunakan Simpan Draft pada formulir proposal untuk melanjutkan pengisian di lain waktu.</span>
          </div>
        )}

        {isAuthenticated && !isLoading && !error && drafts.length > 0 && (
          <div className="research-results-list">
            {drafts.map((draft) => (
              <article className="research-result-item" key={draft.id}>
                <div className="result-number">{String(draft.id).padStart(2, '0')}</div>
                <div className="result-main">
                  <span className="result-status is-draft">Draft</span>
                  <h2>{draft.proposal_title || 'Proposal tanpa judul'}</h2>
                  <p>Draft proposal belum dikirim dan dapat dilanjutkan kapan saja.</p>
                  <div className="result-meta">
                    <span>{draft.researcher_name || 'Nama peneliti belum diisi'}</span>
                    <span>{draft.institution || 'Institusi belum diisi'}</span>
                    <span>Disimpan {formatDate(draft.updated_at)}</span>
                  </div>
                </div>
                <div className="result-actions">
                  <a className="result-action primary" href={`/riset/proposal/${draft.id}/edit`}>Lanjutkan Edit</a>
                  <a className="result-action" href={`/riset/hasil/${draft.id}`}>Detail</a>
                  {draft.pdf_url && <a className="result-action" href={draft.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
                  <button className="result-action danger" type="button" disabled={deletingId === draft.id} onClick={() => setDraftToDelete(draft)}>
                    {deletingId === draft.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {isAuthenticated && !isLoading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      <DeleteProposalModal
        open={draftToDelete !== null}
        proposalTitle={draftToDelete?.proposal_title}
        isDeleting={deletingId !== null}
        onCancel={() => setDraftToDelete(null)}
        onConfirm={() => deleteDraft(draftToDelete)}
      />
    </section>
  )
}

export default ResearchDraftsPage
