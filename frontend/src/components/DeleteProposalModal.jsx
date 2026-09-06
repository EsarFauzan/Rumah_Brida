import DeleteItemModal from './DeleteItemModal'

function DeleteProposalModal({ open, proposalTitle, isDeleting = false, onCancel, onConfirm }) {
  return (
    <DeleteItemModal
      open={open}
      itemTitle={proposalTitle ? `proposal ${proposalTitle}` : null}
      title="Hapus Proposal?"
      description="Apakah Anda yakin ingin menghapus"
      warning="Data proposal dan file PDF terkait akan dihapus secara permanen dan tidak dapat dikembalikan."
      confirmLabel="Hapus Proposal"
      deletingLabel="Menghapus..."
      isDeleting={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
      labelIds={{ title: 'delete-proposal-title', description: 'delete-proposal-description' }}
    />
  )
}

export default DeleteProposalModal
