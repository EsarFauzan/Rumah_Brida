<?php

namespace Tests\Feature;

use App\Models\Innovation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InnovationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_regional_agency_can_be_saved_updated_cleared_and_validated(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $payload = [
            'title' => 'Layanan Daerah',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'regional_agency' => 'Dinas Kesehatan',
        ];
        $id = $this->postJson('/api/innovations', $payload)->assertCreated()
            ->assertJsonPath('data.regional_agency', 'Dinas Kesehatan')->json('data.id');
        $this->getJson('/api/innovations/'.$id)->assertOk()
            ->assertJsonPath('data.regional_agency', 'Dinas Kesehatan');
        $this->putJson('/api/innovations/'.$id, array_merge($payload, [
            'regional_agency' => 'BRIDA Sulawesi Tengah',
        ]))->assertOk()->assertJsonPath('data.regional_agency', 'BRIDA Sulawesi Tengah');
        $this->assertDatabaseHas('innovations', ['id' => $id, 'regional_agency' => 'BRIDA Sulawesi Tengah']);
        $this->putJson('/api/innovations/'.$id, array_merge($payload, [
            'regional_agency' => '',
        ]))->assertOk()->assertJsonPath('data.regional_agency', null);
        unset($payload['regional_agency']);
        $this->postJson('/api/innovations', $payload)->assertCreated();
        $this->postJson('/api/innovations', array_merge($payload, [
            'regional_agency' => str_repeat('A', 256),
        ]))->assertUnprocessable()->assertJsonValidationErrors('regional_agency');
    }

    public function test_owner_can_create_read_update_and_clear_registration_number(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');
        $payload = [
            'title' => 'Inovasi Registrasi',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'registration_number' => '001/BRIDA/2026',
        ];
        $id = $this->postJson('/api/innovations', $payload)->assertCreated()
            ->assertJsonPath('data.registration_number', '001/BRIDA/2026')->json('data.id');
        $this->getJson('/api/innovations/'.$id)->assertOk()
            ->assertJsonPath('data.registration_number', '001/BRIDA/2026');
        $this->putJson('/api/innovations/'.$id, array_merge($payload, [
            'registration_number' => '002/BRIDA/2027', 'reporting_year' => 2027,
        ]))->assertOk()->assertJsonPath('data.registration_number', '002/BRIDA/2027')
            ->assertJsonPath('data.reporting_year', 2027);
        $this->putJson('/api/innovations/'.$id, array_merge($payload, [
            'registration_number' => '',
        ]))->assertOk()->assertJsonPath('data.registration_number', null);
        $this->assertDatabaseHas('innovations', ['id' => $id, 'registration_number' => null]);
        unset($payload['registration_number']);
        $this->postJson('/api/innovations', $payload)->assertCreated();
        $this->postJson('/api/innovations', array_merge($payload, [
            'registration_number' => str_repeat('A', 256),
        ]))->assertUnprocessable()->assertJsonValidationErrors('registration_number');
    }

    public function test_pagination_and_filters_include_records_beyond_first_page(): void
    {
        $user = User::factory()->create();
        for ($i = 1; $i <= 12; $i++) {
            Innovation::create([
                'user_id' => $user->id,
                'title' => $i === 1 ? 'Layanan Terpadu' : 'Inovasi '.$i,
                'innovator_name' => $i === 1 ? 'Peneliti Khusus' : 'Peneliti',
                'innovation_type' => 'Inovasi Pelayanan Publik',
                'government_affair' => 'Kesehatan',
                'reporting_year' => $i === 1 ? 2024 : 2026,
            ]);
        }

        $this->getJson('/api/innovations')->assertOk()
            ->assertJsonCount(10, 'data.data')->assertJsonPath('data.total', 12)
            ->assertJsonPath('total', 12)->assertJsonPath('years', [2026, 2024]);
        $this->getJson('/api/innovations?page=2')->assertOk()
            ->assertJsonCount(2, 'data.data')->assertJsonPath('data.current_page', 2);
        foreach (['search=Layanan', 'search=Khusus', 'year=2024', 'search=Layanan&year=2024'] as $query) {
            $this->getJson('/api/innovations?'.$query)->assertOk()
                ->assertJsonPath('data.total', 1)
                ->assertJsonPath('data.data.0.title', 'Layanan Terpadu');
        }
        $this->getJson('/api/innovations?search=Layanan&year=2026')->assertOk()
            ->assertJsonCount(0, 'data.data')->assertJsonPath('total', 12)
            ->assertJsonPath('years', [2026, 2024]);
    }

    public function test_empty_list_and_invalid_filters(): void
    {
        $this->getJson('/api/innovations')->assertOk()->assertJsonPath('total', 0)
            ->assertJsonPath('years', [])->assertJsonCount(0, 'data.data');
        $this->getJson('/api/innovations?year=invalid&page=0')->assertUnprocessable()
            ->assertJsonValidationErrors(['year', 'page']);
    }
}
