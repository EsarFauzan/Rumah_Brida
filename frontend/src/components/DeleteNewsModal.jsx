import DeleteItemModal from './DeleteItemModal'

function DeleteNewsModal({ open, newsTitle, isDeleting = false, onCancel, onConfirm }) {
  return (
    <DeleteItemModal
      open={open}
      itemTitle={newsTitle ? `berita ${newsTitle}` : null}
      title="Hapus Berita?"
      description="Apakah Anda yakin ingin menghapus"
      warning="Data berita dan gambar terkait akan dihapus secara permanen dan tidak dapat dikembalikan."
      confirmLabel="Hapus Berita"
      deletingLabel="Menghapus..."
      isDeleting={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
      labelIds={{ title: 'delete-news-title', description: 'delete-news-description' }}
    />
  )
}

export default DeleteNewsModal
