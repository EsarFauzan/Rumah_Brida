<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateSuperAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_superadmin_with_hashed_password(): void
    {
        $this->artisan('admin:create-superadmin', [
            '--name' => 'Superadmin Rumah BRIDA',
            '--email' => 'superadmin@example.test',
        ])
            ->expectsQuestion('Kata sandi', 'katasandi123')
            ->expectsQuestion('Konfirmasi kata sandi', 'katasandi123')
            ->expectsOutput('Superadmin berhasil dibuat.')
            ->assertSuccessful();

        $superadmin = User::where('email', 'superadmin@example.test')->firstOrFail();
        $this->assertSame('superadmin', $superadmin->role);
        $this->assertTrue($superadmin->is_active);
        $this->assertTrue(Hash::check('katasandi123', $superadmin->password));
        $this->assertNotSame('katasandi123', $superadmin->password);
    }

    public function test_command_rejects_duplicate_email_without_overwriting_account(): void
    {
        $existing = User::factory()->admin()->create(['email' => 'dipakai@example.test']);

        $this->artisan('admin:create-superadmin', [
            '--name' => 'Superadmin Baru',
            '--email' => 'dipakai@example.test',
        ])
            ->expectsQuestion('Kata sandi', 'katasandi123')
            ->expectsQuestion('Konfirmasi kata sandi', 'katasandi123')
            ->assertFailed();

        $this->assertSame('admin', $existing->fresh()->role);
        $this->assertDatabaseCount('users', 1);
    }
}
