<?php

namespace Tests\Feature;

use App\Models\Innovation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InnovationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pdf_stream_uses_record_paths_and_cors(): void
    {
        Storage::fake('public');
        $innovation = Innovation::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'PDF Uji',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf_path' => 'innovations/profile/test.pdf',
            'profile_pdf_original_name' => 'Profil Daerah.pdf',
            'report_pdf_path' => 'innovations/report/test.pdf',
        ]);
        Storage::disk('public')->put($innovation->profile_pdf_path, '%PDF-1.4 profil');
        Storage::disk('public')->put($innovation->report_pdf_path, '%PDF-1.4 laporan');
        $base = '/api/innovations/'.$innovation->id.'/pdf/';
        $this->withHeaders(['Origin' => 'http://localhost:5173'])
            ->get($base.'profile')->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertStreamedContent('%PDF-1.4 profil');
        $this->get($base.'report')->assertOk()->assertStreamedContent('%PDF-1.4 laporan');
        $this->get($base.'unknown')->assertNotFound();
        $this->get('/api/innovations/999999/pdf/profile')->assertNotFound();
        Storage::disk('public')->delete($innovation->report_pdf_path);
        $this->get($base.'report')->assertNotFound();
        $innovation->update(['profile_pdf_path' => null]);
        $this->get($base.'profile')->assertNotFound();
    }

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

    public function test_store_with_pdf_files_and_validation_errors(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/innovations', [
            'innovator_name' => 'Peneliti',
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'title', 'innovation_type', 'government_affair', 'reporting_year',
        ]);

        $this->postJson('/api/innovations', [
            'title' => 'Inovasi Berkas',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf' => __FILE__,
        ])->assertUnprocessable()->assertJsonValidationErrors('profile_pdf');

        $this->post('/api/innovations', [
            'title' => 'Inovasi Berkas',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf' => $this->fakePdf('Profil Daerah.pdf'),
            'report_pdf' => $this->fakePdf('Laporan Daerah.pdf'),
        ])->assertCreated()
            ->assertJsonPath('data.profile_pdf_original_name', 'Profil Daerah.pdf')
            ->assertJsonPath('data.report_pdf_original_name', 'Laporan Daerah.pdf');

        $innovation = Innovation::where('title', 'Inovasi Berkas')->first();
        $this->assertNotNull($innovation->profile_pdf_path);
        $this->assertNotNull($innovation->report_pdf_path);
        $this->assertSame($user->id, $innovation->user_id);
        Storage::disk('public')->assertExists($innovation->profile_pdf_path);
        Storage::disk('public')->assertExists($innovation->report_pdf_path);
        $this->assertDatabaseCount('innovations', 1);
    }

    public function test_update_keeps_existing_pdf_when_not_replaced(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');
        $innovation = Innovation::create([
            'user_id' => $user->id,
            'title' => 'Inovasi Awal',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf_path' => 'innovations/profile/lama-profil.pdf',
            'profile_pdf_original_name' => 'Profil Lama.pdf',
            'report_pdf_path' => 'innovations/report/lama-laporan.pdf',
            'report_pdf_original_name' => 'Laporan Lama.pdf',
        ]);
        Storage::disk('public')->put($innovation->profile_pdf_path, '%PDF-1.4 lama profil');
        Storage::disk('public')->put($innovation->report_pdf_path, '%PDF-1.4 lama laporan');

        $this->putJson('/api/innovations/'.$innovation->id, [
            'title' => 'Inovasi Diperbarui',
            'innovator_name' => 'Peneliti Baru',
            'innovation_type' => 'Inovasi Daerah Lainnya',
            'government_affair' => 'Sosial',
            'reporting_year' => 2027,
        ])->assertOk()->assertJsonPath('data.title', 'Inovasi Diperbarui')
            ->assertJsonPath('data.profile_pdf_path', 'innovations/profile/lama-profil.pdf');

        $innovation->refresh();
        $this->assertSame('Profil Lama.pdf', $innovation->profile_pdf_original_name);
        $this->assertSame('Laporan Lama.pdf', $innovation->report_pdf_original_name);
        Storage::disk('public')->assertExists($innovation->profile_pdf_path);
        Storage::disk('public')->assertExists($innovation->report_pdf_path);
    }

    public function test_update_replaces_pdf_and_deletes_old_files(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');
        $innovation = Innovation::create([
            'user_id' => $user->id,
            'title' => 'Inovasi Ganti Berkas',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf_path' => 'innovations/profile/lama.pdf',
            'profile_pdf_original_name' => 'Profil Lama.pdf',
        ]);
        Storage::disk('public')->put($innovation->profile_pdf_path, '%PDF-1.4 lama');
        $oldPath = $innovation->profile_pdf_path;

        $this->post('/api/innovations/'.$innovation->id, array_merge([
            '_method' => 'PUT',
            'title' => 'Inovasi Ganti Berkas',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf' => $this->fakePdf('Profil Baru.pdf'),
        ]))->assertOk()->assertJsonPath('data.profile_pdf_original_name', 'Profil Baru.pdf');

        $innovation->refresh();
        $this->assertNotSame($oldPath, $innovation->profile_pdf_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($innovation->profile_pdf_path);
    }

    public function test_destroy_deletes_record_and_both_pdfs_and_rejects_others(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $innovation = Innovation::create([
            'user_id' => $owner->id,
            'title' => 'Inovasi Hapus',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
            'profile_pdf_path' => 'innovations/profile/hapus.pdf',
            'profile_pdf_original_name' => 'Profil.pdf',
            'report_pdf_path' => 'innovations/report/hapus.pdf',
            'report_pdf_original_name' => 'Laporan.pdf',
        ]);
        Storage::disk('public')->put($innovation->profile_pdf_path, '%PDF-1.4 profil');
        Storage::disk('public')->put($innovation->report_pdf_path, '%PDF-1.4 laporan');

        // Tamu ditolak 401.
        $this->deleteJson('/api/innovations/'.$innovation->id)->assertUnauthorized();
        $this->postJson('/api/innovations', [
            'title' => 'Inovasi Hapus',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
        ])->assertUnauthorized();

        // User lain ditolak 403.
        $this->actingAs($other, 'sanctum');
        $this->deleteJson('/api/innovations/'.$innovation->id)->assertForbidden()
            ->assertJsonPath('message', 'Anda tidak berhak menghapus data ini.');
        $this->putJson('/api/innovations/'.$innovation->id, [
            'title' => 'Inovasi Hapus',
            'innovator_name' => 'Peneliti',
            'innovation_type' => 'Inovasi Pelayanan Publik',
            'government_affair' => 'Kesehatan',
            'reporting_year' => 2026,
        ])->assertForbidden()->assertJsonPath('message', 'Anda tidak berhak mengubah data ini.');
        $this->assertDatabaseHas('innovations', ['id' => $innovation->id]);

        // Pemilik dapat menghapus record beserta kedua PDF.
        $this->actingAs($owner, 'sanctum');
        $this->deleteJson('/api/innovations/'.$innovation->id)->assertOk()
            ->assertJsonPath('message', 'Data inovasi berhasil dihapus.');
        $this->assertDatabaseMissing('innovations', ['id' => $innovation->id]);
        Storage::disk('public')->assertMissing($innovation->profile_pdf_path);
        Storage::disk('public')->assertMissing($innovation->report_pdf_path);
    }

    private function fakePdf(string $originalName): File
    {
        return File::fake()->createWithContent(
            $originalName,
            '%PDF-1.4 uji'
        );
    }
}
