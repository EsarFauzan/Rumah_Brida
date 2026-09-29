<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdministratorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_login_and_inactive_admin_cannot_login(): void
    {
        User::factory()->superAdmin()->create([
            'email' => 'superadmin@example.test',
            'password' => 'katasandi123',
        ]);
        User::factory()->admin()->inactive()->create([
            'email' => 'nonaktif@example.test',
            'password' => 'katasandi123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'superadmin@example.test',
            'password' => 'katasandi123',
        ])->assertOk()->assertJsonPath('data.user.role', 'superadmin');

        $this->postJson('/api/auth/login', [
            'email' => 'nonaktif@example.test',
            'password' => 'katasandi123',
        ])->assertForbidden()->assertJsonPath('message', 'Akun administrator ini sedang dinonaktifkan.');
    }

    public function test_guest_and_admin_cannot_access_administrator_management(): void
    {
        $this->getJson('/api/admin/administrators')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/admin/administrators')
            ->assertForbidden()
            ->assertJsonPath('message', 'Fitur ini hanya dapat diakses oleh superadmin.');
        $this->postJson('/api/admin/administrators', $this->accountPayload())->assertForbidden();
    }

    public function test_superadmin_list_only_contains_administrators(): void
    {
        $superadmin = User::factory()->superAdmin()->create(['name' => 'Super Utama']);
        User::factory()->admin()->create(['name' => 'Admin Satu']);
        User::factory()->create(['name' => 'Peneliti Legacy']);
        Sanctum::actingAs($superadmin);

        $response = $this->getJson('/api/admin/administrators')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->assertEqualsCanonicalizing(
            ['Super Utama', 'Admin Satu'],
            collect($response->json('data'))->pluck('name')->all(),
        );
    }

    public function test_superadmin_can_create_admin_but_cannot_assign_superadmin_role(): void
    {
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson('/api/admin/administrators', $this->accountPayload(['role' => 'superadmin']))
            ->assertCreated()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonMissingPath('data.password');

        $this->assertDatabaseHas('users', [
            'email' => 'admin.baru@example.test',
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_create_validates_duplicate_email_and_password(): void
    {
        User::factory()->admin()->create(['email' => 'sudah@example.test']);
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson('/api/admin/administrators', $this->accountPayload([
            'email' => 'sudah@example.test',
            'password' => 'pendek',
            'password_confirmation' => 'berbeda',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_superadmin_can_edit_admin_without_changing_role(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->putJson("/api/admin/administrators/{$admin->id}", [
            'name' => 'Admin Diperbarui',
            'email' => 'admin.update@example.test',
            'role' => 'superadmin',
        ])->assertOk()->assertJsonPath('data.role', 'admin');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'Admin Diperbarui',
            'email' => 'admin.update@example.test',
            'role' => 'admin',
        ]);
    }

    public function test_superadmin_can_reset_admin_password_and_revoke_tokens(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'katasandilama']);
        $admin->createToken('sesi-lama');
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->patchJson("/api/admin/administrators/{$admin->id}/password", [
            'password' => 'katasandibaru',
            'password_confirmation' => 'katasandibaru',
        ])->assertOk()->assertJsonMissingPath('password');

        $this->assertTrue(Hash::check('katasandibaru', $admin->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $admin->id]);
    }

    public function test_superadmin_can_deactivate_and_reactivate_admin_with_token_revocation(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'status@example.test',
            'password' => 'katasandi123',
        ]);
        $admin->createToken('sesi-aktif');
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->patchJson("/api/admin/administrators/{$admin->id}/status", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $admin->id]);

        $this->postJson('/api/auth/login', [
            'email' => 'status@example.test',
            'password' => 'katasandi123',
        ])->assertForbidden();

        $this->patchJson("/api/admin/administrators/{$admin->id}/status", ['is_active' => true])
            ->assertOk()->assertJsonPath('data.is_active', true);

        $this->postJson('/api/auth/login', [
            'email' => 'status@example.test',
            'password' => 'katasandi123',
        ])->assertOk();
    }

    public function test_superadmin_cannot_manage_self_or_other_superadmins_through_panel(): void
    {
        $superadmin = User::factory()->superAdmin()->create();
        $other = User::factory()->superAdmin()->create();
        Sanctum::actingAs($superadmin);

        $this->patchJson("/api/admin/administrators/{$superadmin->id}/status", ['is_active' => false])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Akun superadmin yang sedang digunakan tidak dapat dinonaktifkan.');
        $this->putJson("/api/admin/administrators/{$other->id}", [
            'name' => 'Diubah',
            'email' => $other->email,
        ])->assertForbidden();
        $this->patchJson("/api/admin/administrators/{$other->id}/password", [
            'password' => 'katasandibaru',
            'password_confirmation' => 'katasandibaru',
        ])->assertForbidden();
        $this->patchJson("/api/admin/administrators/{$other->id}/status", ['is_active' => false])
            ->assertForbidden();
    }

    public function test_superadmin_retains_existing_operational_access(): void
    {
        $superadmin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($superadmin);

        $this->getJson('/api/admin/news')->assertOk();
        $this->postJson('/api/innovations', [
            'title' => 'Inovasi Superadmin',
            'innovator_name' => 'Superadmin',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Pendidikan',
            'reporting_year' => 2026,
        ])->assertCreated();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function accountPayload(array $overrides = []): array
    {
        return [
            'name' => 'Admin Baru',
            'email' => 'admin.baru@example.test',
            'password' => 'katasandi123',
            'password_confirmation' => 'katasandi123',
            ...$overrides,
        ];
    }
}
