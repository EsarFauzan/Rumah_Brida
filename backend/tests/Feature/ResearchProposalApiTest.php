<?php

namespace Tests\Feature;

use App\Models\ResearchProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
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
        Storage::fake('local');
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
        Storage::disk('local')->assertExists($proposal->pdf_path);
        Storage::disk('public')->assertMissing($proposal->pdf_path);
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

    public function test_proposal_list_is_paginated_and_does_not_include_chapters(): void
    {
        $owner = User::factory()->create();

        foreach (range(1, 11) as $index) {
            ResearchProposal::create($this->payload([
                'user_id' => $owner->id,
                'proposal_title' => "Proposal pagination {$index}",
                'status' => 'submitted',
                'submitted_at' => now(),
            ], withAction: false));
        }

        $response = $this->getJson('/api/research-proposals?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('pagination.current_page', 1)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.total', 11);

        $this->assertArrayNotHasKey('chapter_one', $response->json('data.0'));
        $this->assertArrayNotHasKey('chapter_two', $response->json('data.0'));
        $this->assertArrayNotHasKey('chapter_three', $response->json('data.0'));
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

        $this->getJson('/api/research-proposals?status=draft')->assertUnauthorized();
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
        Storage::fake('local');
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'pdf_path' => 'research-proposals/lama.pdf',
            'pdf_original_name' => 'lama.pdf',
        ], withAction: false));
        Storage::disk('local')->put('research-proposals/lama.pdf', 'konten');

        Sanctum::actingAs($user);

        $this->putJson("/api/research-proposals/{$proposal->id}", $this->payload(['action' => 'submit']))
            ->assertOk()
            ->assertJsonPath('data.pdf_original_name', 'lama.pdf');

        Storage::disk('local')->assertExists('research-proposals/lama.pdf');
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
        Storage::fake('local');
        $user = User::factory()->create();
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => $user->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'pdf_path' => 'research-proposals/hapus.pdf',
            'pdf_original_name' => 'hapus.pdf',
        ], withAction: false));
        Storage::disk('local')->put('research-proposals/hapus.pdf', 'konten');

        Sanctum::actingAs($user);

        $this->deleteJson("/api/research-proposals/{$proposal->id}")->assertOk();

        $this->assertDatabaseMissing('research_proposals', ['id' => $proposal->id]);
        Storage::disk('local')->assertMissing('research-proposals/hapus.pdf');
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

    public function test_researcher_cannot_open_admin_proposal_list(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/research-proposals')->assertForbidden();
    }

    public function test_admin_can_approve_or_reject_submitted_proposal(): void
    {
        $proposal = ResearchProposal::create($this->payload([
            'user_id' => User::factory()->create()->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ], withAction: false));
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/research-proposals?verification_status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.can_review', true);

        $this->patchJson("/api/admin/research-proposals/{$proposal->id}/verification", [
            'verification_status' => 'approved',
        ])->assertOk()->assertJsonPath('data.verification_status', 'approved');

        $this->assertDatabaseHas('research_proposals', [
            'id' => $proposal->id,
            'verification_status' => 'approved',
            'reviewed_by_id' => $admin->id,
        ]);

        $this->patchJson("/api/admin/research-proposals/{$proposal->id}/verification", [
            'verification_status' => 'rejected',
        ])->assertStatus(422)->assertJsonValidationErrors(['review_note']);

        $this->patchJson("/api/admin/research-proposals/{$proposal->id}/verification", [
            'verification_status' => 'pending',
        ])->assertOk()->assertJsonPath('data.verification_status', 'pending');

        $this->assertDatabaseHas('research_proposals', [
            'id' => $proposal->id,
            'verification_status' => 'pending',
            'reviewed_by_id' => null,
        ]);
    }

    public function test_pdf_can_be_streamed_with_signed_url(): void
    {
        Storage::fake('local');
        $proposal = $this->proposalWithPdf(['status' => 'submitted', 'submitted_at' => now()]);

        $response = $this->get($this->signedPdfUrl($proposal));

        $response->assertOk()
            ->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('berkas.pdf', (string) $response->headers->get('content-disposition'));
    }

    public function test_pdf_cannot_be_streamed_without_valid_signature(): void
    {
        Storage::fake('local');
        $proposal = $this->proposalWithPdf(['status' => 'submitted', 'submitted_at' => now()]);

        $this->get("/api/research-proposals/{$proposal->id}/pdf")->assertForbidden();
        $this->get($this->signedPdfUrl($proposal).'&extra=1')->assertForbidden();
    }

    public function test_expired_signed_pdf_url_is_rejected(): void
    {
        Storage::fake('local');
        $proposal = $this->proposalWithPdf(['status' => 'submitted', 'submitted_at' => now()]);
        $url = $this->signedPdfUrl($proposal);

        $this->travel(31)->minutes();

        $this->get($url)->assertForbidden();
    }

    public function test_pdf_returns_not_found_when_file_is_missing(): void
    {
        Storage::fake('local');
        $proposal = ResearchProposal::create($this->payload([
            'status' => 'submitted',
            'submitted_at' => now(),
            'pdf_path' => 'research-proposals/hilang.pdf',
            'pdf_original_name' => 'hilang.pdf',
        ], withAction: false));

        $this->get($this->signedPdfUrl($proposal))->assertNotFound();
    }

    public function test_pdf_url_is_signed_api_url_instead_of_public_storage_url(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $proposal = $this->proposalWithPdf(['user_id' => $owner->id, 'status' => 'draft']);

        // Draft tetap tertutup untuk orang lain, jadi URL PDF pun tidak terbit.
        $this->getJson("/api/research-proposals/{$proposal->id}")->assertForbidden();

        Sanctum::actingAs($owner);
        $pdfUrl = $this->getJson("/api/research-proposals/{$proposal->id}")
            ->assertOk()
            ->json('data.pdf_url');

        $this->assertStringContainsString("/api/research-proposals/{$proposal->id}/pdf", $pdfUrl);
        $this->assertStringContainsString('signature=', $pdfUrl);
        $this->assertStringNotContainsString('/storage/', $pdfUrl);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function proposalWithPdf(array $overrides = []): ResearchProposal
    {
        $proposal = ResearchProposal::create($this->payload([
            'pdf_path' => 'research-proposals/berkas.pdf',
            'pdf_original_name' => 'berkas.pdf',
            ...$overrides,
        ], withAction: false));

        Storage::disk('local')->put('research-proposals/berkas.pdf', '%PDF-1.4 konten uji');

        return $proposal;
    }

    private function signedPdfUrl(ResearchProposal $proposal): string
    {
        return URL::temporarySignedRoute(
            'research-proposals.pdf',
            now()->addMinutes(30),
            ['researchProposal' => $proposal->id],
        );
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
