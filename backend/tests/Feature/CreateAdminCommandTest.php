<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_admin_with_a_hashed_password(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Admin Rumah BRIDA',
            '--email' => 'admin@example.test',
        ])
            ->expectsQuestion('Kata sandi', 'katasandi123')
            ->expectsQuestion('Konfirmasi kata sandi', 'katasandi123')
            ->expectsOutput('Administrator admin@example.test berhasil dibuat.')
            ->assertSuccessful();

        $admin = User::where('email', 'admin@example.test')->firstOrFail();

        $this->assertSame('admin', $admin->role);
        $this->assertTrue(Hash::check('katasandi123', $admin->password));
        $this->assertNotSame('katasandi123', $admin->password);
    }
}
