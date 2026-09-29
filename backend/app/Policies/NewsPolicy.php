<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;

class NewsPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function update(User $user, News $news): bool
    {
        return $user->isAdministrator();
    }

    public function delete(User $user, News $news): bool
    {
        return $user->isAdministrator();
    }
}
