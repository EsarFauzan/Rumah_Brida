<?php

namespace Tests\Feature;

use App\Models\Competition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompetitionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_and_filter_competitions(): void
    {
        $this->competition(['code' => 'ASN-01', 'name' => 'Lomba ASN', 'status' => 'open', 'type' => 'Lomba untuk ASN']);
        $this->competition(['code' => 'OPD-01', 'name' => 'Lomba OPD', 'status' => 'closed', 'type' => 'Lomba untuk OPD']);

        $this->getJson('/api/competitions?status=open&search=ASN')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'ASN-01')
            ->assertJsonPath('pagination.total', 1);

        $this->getJson('/api/competitions?type=Lomba%20untuk%20OPD')
            ->assertOk()
            ->assertJsonPath('data.0.code', 'OPD-01');
    }

    public function test_only_administrators_can_manage_competitions(): void
    {
        Storage::fake('local');

        $this->withHeader('Accept', 'application/json')
            ->post('/api/admin/competitions', $this->payload())->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->post('/api/admin/competitions', $this->payload())->assertForbidden();

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->post('/api/admin/competitions', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'LMB-001')
            ->assertJsonPath('data.type', 'Lomba untuk Masyarakat');

        $this->assertDatabaseHas('competitions', ['code' => 'LMB-001', 'status' => 'open']);
    }

    public function test_competition_payload_validation_is_enforced(): void
    {
        Storage::fake('local');
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->post('/api/admin/competitions', [
            ...$this->payload(),
            'closing_date' => '2026-10-01',
            'opening_date' => '2026-10-10',
            'status' => 'published',
            'type' => 'Lomba lainnya',
            'guideline' => File::fake()->create('juknis.txt', 10, 'text/plain'),
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'closing_date', 'status', 'type', 'guideline',
        ]);

        $this->post('/api/admin/competitions', collect($this->payload())->except('guideline')->all())
            ->assertUnprocessable()->assertJsonValidationErrors('guideline');
    }

    public function test_admin_can_update_replace_guideline_and_delete_competition(): void
    {
        Storage::fake('local');
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $id = $this->post('/api/admin/competitions', $this->payload())
            ->assertCreated()->json('data.id');
        $competition = Competition::findOrFail($id);
        $oldPath = $competition->guideline_path;
        Storage::disk('local')->assertExists($oldPath);

        $this->post("/api/admin/competitions/{$id}", [
            ...$this->payload(),
            '_method' => 'PUT',
            'name' => 'Lomba Inovasi Diperbarui',
            'guideline' => null,
        ])->assertOk()->assertJsonPath('data.name', 'Lomba Inovasi Diperbarui');
        Storage::disk('local')->assertExists($oldPath);

        $this->post("/api/admin/competitions/{$id}", [
            ...$this->payload(),
            '_method' => 'PUT',
            'guideline' => File::fake()->create('juknis-baru.pdf', 120, 'application/pdf'),
        ])->assertOk()->assertJsonPath('data.guideline_original_name', 'juknis-baru.pdf');

        $competition->refresh();
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($competition->guideline_path);
        $newPath = $competition->guideline_path;

        $this->deleteJson("/api/admin/competitions/{$id}")->assertOk();
        $this->assertDatabaseMissing('competitions', ['id' => $id]);
        Storage::disk('local')->assertMissing($newPath);
    }

    public function test_guideline_can_be_streamed_publicly(): void
    {
        Storage::fake('local');
        $competition = $this->competition([
            'guideline_path' => 'competition-guidelines/juknis.pdf',
            'guideline_original_name' => 'Juknis Lomba.pdf',
        ]);
        Storage::disk('local')->put($competition->guideline_path, '%PDF-1.4 juknis');

        $this->get("/api/competitions/{$competition->id}/guideline")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertStreamedContent('%PDF-1.4 juknis');

        Storage::disk('local')->delete($competition->guideline_path);
        $this->get("/api/competitions/{$competition->id}/guideline")->assertNotFound();
    }

    public function test_superadmin_can_manage_competitions_and_codes_are_unique(): void
    {
        Storage::fake('local');
        Sanctum::actingAs(User::factory()->superAdmin()->create());
        $this->post('/api/admin/competitions', $this->payload())->assertCreated();
        $this->post('/api/admin/competitions', $this->payload())
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->getJson('/api/admin/competitions')->assertOk()
            ->assertJsonPath('counts.total', 1)
            ->assertJsonPath('counts.open', 1);
    }

    public function test_public_options_only_include_competitions_open_for_registration(): void
    {
        $this->travelTo(Carbon::parse('2026-10-10 10:00:00'));
        $open = $this->competition(['code' => 'OPEN-01', 'name' => 'Lomba Aktif']);
        $this->competition(['code' => 'CLOSED-01', 'status' => 'closed']);
        $this->competition(['code' => 'FUTURE-01', 'opening_date' => '2026-11-01', 'closing_date' => '2026-11-30']);

        $this->getJson('/api/competitions/options')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $open->id)
            ->assertJsonPath('data.0.name', 'Lomba Aktif')
            ->assertJsonCount(3, 'types');
    }

    public function test_public_can_register_for_an_open_competition(): void
    {
        $this->travelTo(Carbon::parse('2026-10-10 10:00:00'));
        $competition = $this->competition();

        $this->postJson("/api/competitions/{$competition->id}/registrations", $this->registrationPayload())
            ->assertCreated()
            ->assertJsonPath('data.competition_id', $competition->id)
            ->assertJsonPath('data.competition_name', $competition->name);

        $this->assertDatabaseHas('competition_registrations', [
            'competition_id' => $competition->id,
            'nik' => '7201010101010001',
            'product_name' => 'Sistem Pelayanan Terpadu',
        ]);
    }

    public function test_registration_validates_participant_data_and_duplicate_nik(): void
    {
        $this->travelTo(Carbon::parse('2026-10-10 10:00:00'));
        $competition = $this->competition();

        $this->postJson("/api/competitions/{$competition->id}/registrations", [
            'name' => '',
            'nik' => '1234',
            'address' => '',
            'product_name' => '',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'nik', 'address', 'product_name']);

        $this->postJson("/api/competitions/{$competition->id}/registrations", $this->registrationPayload())
            ->assertCreated();
        $this->postJson("/api/competitions/{$competition->id}/registrations", $this->registrationPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('nik');
    }

    public function test_registration_is_rejected_when_competition_is_closed_or_outside_period(): void
    {
        $this->travelTo(Carbon::parse('2026-10-10 10:00:00'));
        $closed = $this->competition(['code' => 'CLOSED-REG', 'status' => 'closed']);
        $future = $this->competition(['code' => 'FUTURE-REG', 'opening_date' => '2026-11-01', 'closing_date' => '2026-11-30']);

        $this->postJson("/api/competitions/{$closed->id}/registrations", $this->registrationPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('competition_id');
        $this->postJson("/api/competitions/{$future->id}/registrations", $this->registrationPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('competition_id');
    }

    private function competition(array $overrides = []): Competition
    {
        return Competition::create(array_merge([
            'user_id' => User::factory()->admin()->create()->id,
            'code' => 'LMB-'.fake()->unique()->numerify('###'),
            'name' => 'Lomba Inovasi Daerah',
            'description' => 'Deskripsi lomba.',
            'opening_date' => '2026-10-01',
            'closing_date' => '2026-10-31',
            'status' => 'open',
            'type' => 'Lomba untuk Masyarakat',
            'guideline_path' => 'competition-guidelines/default.pdf',
            'guideline_original_name' => 'juknis.pdf',
        ], $overrides));
    }

    private function payload(): array
    {
        return [
            'code' => 'LMB-001',
            'name' => 'Lomba Inovasi Daerah',
            'description' => 'Kompetisi inovasi untuk masyarakat Sulawesi Tengah.',
            'opening_date' => '2026-10-01',
            'closing_date' => '2026-10-31',
            'status' => 'open',
            'type' => 'Lomba untuk Masyarakat',
            'guideline' => File::fake()->create('juknis.pdf', 100, 'application/pdf'),
        ];
    }

    private function registrationPayload(): array
    {
        return [
            'name' => 'Nur Aisyah',
            'nik' => '7201010101010001',
            'address' => 'Jalan Merdeka Nomor 10, Palu',
            'product_name' => 'Sistem Pelayanan Terpadu',
        ];
    }
}
