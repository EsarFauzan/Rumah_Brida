<?php

namespace App\Policies;

use App\Models\ResearchProposal;
use App\Models\User;

class ResearchProposalPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Hanya pemilik proposal yang boleh melihat detail miliknya sendiri
     * ketika proposal masih berstatus draft.
     */
    public function view(?User $user, ResearchProposal $researchProposal): bool
    {
        if ($researchProposal->status === 'submitted') {
            return true;
        }

        return $this->owns($user, $researchProposal);
    }

    public function update(User $user, ResearchProposal $researchProposal): bool
    {
        return $this->owns($user, $researchProposal);
    }

    public function delete(User $user, ResearchProposal $researchProposal): bool
    {
        return $this->owns($user, $researchProposal);
    }

    public function review(User $user, ResearchProposal $researchProposal): bool
    {
        return $user->role === 'admin' && $researchProposal->status === 'submitted';
    }

    /**
     * Proposal lama (sebelum autentikasi ada) belum punya pemilik sehingga
     * tidak boleh diubah atau dihapus oleh siapa pun lewat API.
     */
    private function owns(?User $user, ResearchProposal $researchProposal): bool
    {
        return $user !== null
            && $researchProposal->user_id !== null
            && $user->id === $researchProposal->user_id;
    }
}
