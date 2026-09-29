import DeleteItemModal from './DeleteItemModal'

export default function DeleteCompetitionModal({ open, competitionName, isDeleting, onCancel, onConfirm }) {
  return <DeleteItemModal
    open={open}
    itemTitle={competitionName ? `lomba ${competitionName}` : null}
    title="Hapus Lomba?"
    description="Apakah Anda yakin ingin menghapus"
    warning="Data lomba dan file Juknis akan dihapus secara permanen."
    confirmLabel="Hapus Lomba"
    deletingLabel="Menghapus..."
    isDeleting={isDeleting}
    onCancel={onCancel}
    onConfirm={onConfirm}
    labelIds={{ title: 'delete-competition-title', description: 'delete-competition-description' }}
  />
}
