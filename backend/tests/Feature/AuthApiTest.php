<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Peneliti Baru',
            'email' => 'peneliti.baru@example.test',
            'password' => 'katasandi123',
            'password_confirmation' => 'katasandi123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'peneliti.baru@example.test')
            ->assertJsonStructure(['message', 'data' => ['user' => ['id', 'name', 'email'], 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'peneliti.baru@example.test']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'ada@example.test']);

        $this->postJson('/api/auth/register', [
            'name' => 'Nama Lain',
            'email' => 'ada@example.test',
            'password' => 'katasandi123',
            'password_confirmation' => 'katasandi123',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'peneliti@example.test',
            'password' => 'katasandi123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'peneliti@example.test',
            'password' => 'katasandi123',
        ])->assertOk()->assertJsonPath('data.user.email', 'peneliti@example.test');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'peneliti@example.test',
            'password' => 'katasandi123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'peneliti@example.test',
            'password' => 'salah-sekali',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_authenticated_user_can_read_profile_and_logout(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->postJson('/api/auth/logout')->assertOk();
    }
}
