<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_endpoint_is_not_available(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Pengguna Baru',
            'email' => 'baru@example.test',
            'password' => 'katasandi123',
            'password_confirmation' => 'katasandi123',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'baru@example.test']);
    }

    public function test_researcher_cannot_login_or_receive_token(): void
    {
        $researcher = User::factory()->create([
            'email' => 'peneliti@example.test',
            'password' => 'katasandi123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'peneliti@example.test',
            'password' => 'katasandi123',
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun ini tidak memiliki akses administrator.');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $researcher->id,
        ]);
    }

    public function test_admin_can_login_read_profile_and_logout(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin@example.test',
            'password' => 'katasandi123',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.test',
            'password' => 'katasandi123',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'admin@example.test')
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonStructure(['message', 'data' => ['user' => ['id', 'name', 'email', 'role'], 'token']]);

        $token = $login->json('data.token');
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->getJson('/api/auth/me', $headers)
            ->assertOk()
            ->assertJsonPath('data.id', $admin->id);
        $this->postJson('/api/auth/logout', [], $headers)->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.test',
            'password' => 'katasandi123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.test',
            'password' => 'salah-sekali',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_admin_api_rejects_guest_and_researcher_but_allows_admin(): void
    {
        $this->getJson('/api/admin/news')->assertUnauthorized();

        $researcher = User::factory()->create();
        $this->actingAs($researcher)
            ->getJson('/api/admin/news')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun ini tidak memiliki akses administrator.');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)
            ->getJson('/api/admin/news')
            ->assertOk();
    }
}
