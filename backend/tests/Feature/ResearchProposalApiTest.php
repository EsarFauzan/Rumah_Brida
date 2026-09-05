<?php

namespace Tests\Feature;

use App\Models\ResearchProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ResearchProposalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_proposal(): void
    {
        $this->postJson('/api/research-proposals', ['action' => 'draft'])
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_submit_proposal_with_pdf(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/research-proposals', $this->payload([
            'action' => 'submit',
            'pdf' => UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf'),
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.can_manage', true);

        $proposal = ResearchProposal::sole();
        $this->assertNotNull($proposal->submitted_at);
        Storage::disk('public')->assertExists($proposal->pdf_path);
    }

    public function test_submit_requires_complete_payload(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/research-proposals', ['action' => 'submit'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['researcher_name', 'proposal_title', 'pdf']);
    }

    public function test_chapter_word_limit_is_enforced(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/research-proposals', $this->payload([
            'action' => 'draft',
            'chapter_one' => str_repeat('kata ', 301),
        ]))->assertStatus(422)->assertJsonValidationErrors(['chapter_one']);
    }

    public function test_submitted_proposal_is_publicly_readable_but_not_manageable(): void
    {
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => User::factory()->create()->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ], withAction: false));

        $this->getJson("/api/research-proposals/{$proposal->id}")
            ->assertOk()
            ->assertJsonPath('data.can_manage', false);

        $this->getJson('/api/research-proposals')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_draft_is_hidden_from_guests(): void
    {
        ResearchProposal::create($this->payload([
            'user_id' => User::factory()->create()->id,
            'status' => 'draft',
        ], withAction: false));

        $this->getJson('/api/research-proposals?status=all')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_draft_detail_is_forbidden_for_non_owner(): void
    {
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => User::factory()->create()->id,
            'status' => 'draft',
        ], withAction: false));

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/research-proposals/{$proposal->id}")->assertForbidden();
    }

    /**
     * Route baca bersifat publik sehingga tidak memakai middleware auth:sanctum.
     * Tes ini memakai bearer token asli (bukan Sanctum::actingAs) supaya guard
     * default benar-benar teruji: pemilik harus tetap dikenali di route publik.
     */
    public function test_owner_sees_can_manage_true_on_public_read_with_bearer_token(): void
    {
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ], withAction: false));

        $this->withHeader('Authorization', 'Bearer '.$user->createToken('uji')->plainTextToken)
            ->getJson("/api/research-proposals/{$proposal->id}")
            ->assertOk()
            ->assertJsonPath('data.can_manage', true);
    }

    public function test_owner_sees_own_draft_in_list_with_bearer_token(): void
    {
        $user = User::factory()->create();
        ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'draft',
        ], withAction: false));

        $this->withHeader('Authorization', 'Bearer '.$user->createToken('uji')->plainTextToken)
            ->getJson('/api/research-proposals?status=all')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.can_manage', true);
    }

    public function test_partial_draft_update_keeps_existing_values(): void
    {
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'draft',
        ], withAction: false));

        Sanctum::actingAs($user);

        $this->putJson("/api/research-proposals/{$proposal->id}", [
            'action' => 'draft',
            'proposal_title' => 'Judul Diperbarui',
        ])->assertOk();

        $proposal->refresh();
        $this->assertSame('Judul Diperbarui', $proposal->proposal_title);
        $this->assertSame('Peneliti Uji', $proposal->researcher_name);
        $this->assertSame('Universitas Tadulako', $proposal->institution);
        $this->assertNotNull($proposal->chapter_one);
    }

    public function test_update_keeps_existing_pdf_when_no_new_file_sent(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'pdf_path' => 'research-proposals/lama.pdf',
            'pdf_original_name' => 'lama.pdf',
        ], withAction: false));
        Storage::disk('public')->put('research-proposals/lama.pdf', 'konten');

        Sanctum::actingAs($user);

        $this->putJson("/api/research-proposals/{$proposal->id}", $this->payload(['action' => 'submit']))
            ->assertOk()
            ->assertJsonPath('data.pdf_original_name', 'lama.pdf');

        Storage::disk('public')->assertExists('research-proposals/lama.pdf');
    }

    public function test_non_owner_cannot_update_or_delete(): void
    {
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => User::factory()->create()->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ], withAction: false));

        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/research-proposals/{$proposal->id}", ['action' => 'draft'])->assertForbidden();
        $this->deleteJson("/api/research-proposals/{$proposal->id}")->assertForbidden();
        $this->assertDatabaseHas('research_proposals', ['id' => $proposal->id]);
    }

    public function test_owner_can_delete_proposal_and_pdf(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'pdf_path' => 'research-proposals/hapus.pdf',
            'pdf_original_name' => 'hapus.pdf',
        ], withAction: false));
        Storage::disk('public')->put('research-proposals/hapus.pdf', 'konten');

        Sanctum::actingAs($user);

        $this->deleteJson("/api/research-proposals/{$proposal->id}")->assertOk();

        $this->assertDatabaseMissing('research_proposals', ['id' => $proposal->id]);
        Storage::disk('public')->assertMissing('research-proposals/hapus.pdf');
    }

    public function test_legacy_proposal_without_owner_cannot_be_modified(): void
    {
        $proposal = ResearchProposal::create($this->payload([
            'status' => 'submitted',
            'submitted_at' => now(),
        ], withAction: false));

        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/research-proposals/{$proposal->id}", ['action' => 'draft'])->assertForbidden();
        $this->deleteJson("/api/research-proposals/{$proposal->id}")->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = [], bool $withAction = true): array
    {
        $payload = [
            'researcher_name' => 'Peneliti Uji',
            'proposal_title' => 'Proposal Uji Otomatis',
            'institution' => 'Universitas Tadulako',
            'research_coordinates' => '-0.8917, 119.8707',
            'chapter_one' => 'Pendahuluan uji otomatis.',
            'chapter_two' => 'Rancang bangun uji otomatis.',
            'chapter_three' => 'Hasil yang dituju uji otomatis.',
        ];

        if ($withAction) {
            $payload['action'] = 'draft';
        }

        return [...$payload, ...$overrides];
    }
}
