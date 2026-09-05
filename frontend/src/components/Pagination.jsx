function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.last_page <= 1) return null

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <button type="button" disabled={pagination.current_page === 1} onClick={() => onPageChange(pagination.current_page - 1)}>Sebelumnya</button>
      <span>Halaman {pagination.current_page} dari {pagination.last_page}</span>
      <button type="button" disabled={pagination.current_page === pagination.last_page} onClick={() => onPageChange(pagination.current_page + 1)}>Berikutnya</button>
    </nav>
  )
}

export default Pagination
