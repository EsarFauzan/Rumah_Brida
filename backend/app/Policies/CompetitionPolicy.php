<?php

namespace App\Policies;

use App\Models\Competition;
use App\Models\User;

class CompetitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function update(User $user, Competition $competition): bool
    {
        return $user->isAdministrator();
    }

    public function delete(User $user, Competition $competition): bool
    {
        return $user->isAdministrator();
    }
}
