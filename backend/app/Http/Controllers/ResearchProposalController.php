<?php

namespace App\Http\Controllers;

use App\Models\ResearchProposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResearchProposalController extends Controller
{
    /**
     * Disk privat (storage/app/private), bukan disk `public`, supaya file PDF
     * tidak bisa diambil langsung lewat URL storage tanpa otorisasi.
     */
    private const PDF_DISK = 'local';

    private const PDF_URL_TTL_MINUTES = 30;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['draft', 'submitted', 'all'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);
        $status = $validated['status'] ?? 'submitted';
        $perPage = $validated['per_page'] ?? 10;
        $user = $request->user();

        abort_if($status === 'draft' && ! $user, 401);

        // Draft hanya boleh terlihat oleh pemiliknya sendiri.
        if ($status !== 'submitted' && ! $user) {
            $status = 'submitted';
        }

        $proposals = ResearchProposal::query()
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when(
                $status !== 'submitted' && $user,
                fn ($query) => $query->where(function ($inner) use ($user) {
                    $inner->where('status', 'submitted')
                        ->orWhere('user_id', $user->id);
                }),
            )
            ->latest('submitted_at')
            ->latest('created_at')
            ->paginate($perPage)
            ->through(fn (ResearchProposal $proposal) => $this->serializeListItem($proposal));

        return response()->json($this->paginatedResponse($proposals));
    }

    public function adminIndex(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', ResearchProposal::class);

        $validated = $request->validate([
            'verification_status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'all'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);
        $verificationStatus = $validated['verification_status'] ?? 'pending';
        $perPage = $validated['per_page'] ?? 10;

        $proposals = ResearchProposal::query()
            ->where('status', 'submitted')
            ->when($verificationStatus !== 'all', fn ($query) => $query->where('verification_status', $verificationStatus))
            ->latest('submitted_at')
            ->latest('created_at')
            ->paginate($perPage)
            ->through(fn (ResearchProposal $proposal) => $this->serializeListItem($proposal));

        return response()->json($this->paginatedResponse($proposals));
    }

    public function store(Request $request): JsonResponse
    {
        $isSubmit = $request->input('action') === 'submit';
        $validated = $this->validatePayload($request, $isSubmit, $isSubmit);

        $pdfPath = $request->hasFile('pdf')
            ? $request->file('pdf')->store('research-proposals', self::PDF_DISK)
            : null;

        $proposal = ResearchProposal::create([
            'user_id' => $request->user()->id,
            'researcher_name' => $validated['researcher_name'] ?? null,
            'proposal_title' => $validated['proposal_title'] ?? null,
            'institution' => $validated['institution'] ?? null,
            'research_coordinates' => $validated['research_coordinates'] ?? null,
            'chapter_one' => $validated['chapter_one'] ?? null,
            'chapter_two' => $validated['chapter_two'] ?? null,
            'chapter_three' => $validated['chapter_three'] ?? null,
            'pdf_path' => $pdfPath,
            'pdf_original_name' => $request->file('pdf')?->getClientOriginalName(),
            'status' => $isSubmit ? 'submitted' : 'draft',
            'verification_status' => 'pending',
            'submitted_at' => $isSubmit ? now() : null,
        ]);

        return response()->json([
            'message' => $isSubmit ? 'Proposal berhasil dikirim.' : 'Draft berhasil disimpan.',
            'data' => $this->serialize($proposal),
        ], 201);
    }

    public function show(ResearchProposal $researchProposal): JsonResponse
    {
        Gate::authorize('view', $researchProposal);

        return response()->json(['data' => $this->serialize($researchProposal)]);
    }

    public function update(Request $request, ResearchProposal $researchProposal): JsonResponse
    {
        Gate::authorize('update', $researchProposal);

        $isSubmit = $request->input('action', $researchProposal->status) !== 'draft';
        $validated = $this->validatePayload($request, $isSubmit, false);
        $oldPdfPath = $researchProposal->pdf_path;

        // Hanya kolom yang benar-benar dikirim yang ditulis, supaya update
        // sebagian (mis. simpan draft) tidak mengosongkan data yang sudah ada.
        $data = array_intersect_key($validated, array_flip([
            'researcher_name',
            'proposal_title',
            'institution',
            'research_coordinates',
            'chapter_one',
            'chapter_two',
            'chapter_three',
        ]));

        $data['status'] = $isSubmit ? 'submitted' : 'draft';
        $data['submitted_at'] = $isSubmit ? ($researchProposal->submitted_at ?? now()) : null;

        if ($isSubmit) {
            // Perubahan setelah pengiriman wajib melalui peninjauan admin lagi.
            $data['verification_status'] = 'pending';
            $data['review_note'] = null;
            $data['reviewed_by_id'] = null;
            $data['reviewed_at'] = null;
        }

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('research-proposals', self::PDF_DISK);
            $data['pdf_original_name'] = $request->file('pdf')->getClientOriginalName();
        }

        $researchProposal->update($data);

        if ($request->hasFile('pdf') && $oldPdfPath) {
            Storage::disk(self::PDF_DISK)->delete($oldPdfPath);
        }

        return response()->json([
            'message' => 'Proposal berhasil diperbarui.',
            'data' => $this->serialize($researchProposal->fresh()),
        ]);
    }

    public function destroy(ResearchProposal $researchProposal): JsonResponse
    {
        Gate::authorize('delete', $researchProposal);

        if ($researchProposal->pdf_path) {
            Storage::disk(self::PDF_DISK)->delete($researchProposal->pdf_path);
        }

        $researchProposal->delete();

        return response()->json(['message' => 'Proposal berhasil dihapus.']);
    }

    public function review(Request $request, ResearchProposal $researchProposal): JsonResponse
    {
        Gate::authorize('review', $researchProposal);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            'review_note' => ['nullable', 'string', 'max:1000', 'required_if:verification_status,rejected'],
        ], [
            'required' => ':attribute wajib diisi.',
            'required_if' => ':attribute wajib diisi saat proposal ditolak.',
        ], [
            'verification_status' => 'Status verifikasi',
            'review_note' => 'Catatan admin',
        ]);

        $isPending = $validated['verification_status'] === 'pending';

        $researchProposal->update([
            'verification_status' => $validated['verification_status'],
            'review_note' => $isPending ? null : ($validated['review_note'] ?? null),
            'reviewed_by_id' => $isPending ? null : $request->user()->id,
            'reviewed_at' => $isPending ? null : now(),
        ]);

        return response()->json([
            'message' => match ($validated['verification_status']) {
                'approved' => 'Proposal disetujui.',
                'rejected' => 'Proposal ditolak.',
                default => 'Proposal dikembalikan ke status menunggu.',
            },
            'data' => $this->serialize($researchProposal->fresh()),
        ]);
    }

    /**
     * Otorisasi di sini bersandar pada tanda tangan URL, bukan `Gate`, karena
     * tab baru browser tidak mengirim bearer token. URL bertanda tangan hanya
     * dibuat di `serialize()` untuk proposal yang boleh dilihat pemintanya, dan
     * kedaluwarsa setelah PDF_URL_TTL_MINUTES.
     */
    public function pdf(ResearchProposal $researchProposal): StreamedResponse
    {
        abort_if(
            $researchProposal->pdf_path === null
                || ! Storage::disk(self::PDF_DISK)->exists($researchProposal->pdf_path),
            404,
            'File proposal tidak ditemukan.',
        );

        return Storage::disk(self::PDF_DISK)->response(
            $researchProposal->pdf_path,
            $researchProposal->pdf_original_name ?? 'proposal.pdf',
            ['Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox"],
        );
    }

    private function validatePayload(Request $request, bool $isSubmit, bool $requirePdf): array
    {
        $required = $isSubmit ? 'required' : 'nullable';
        $pdfRequired = $requirePdf ? $required : 'nullable';

        $validated = $request->validate(
            [
                'action' => ['required', Rule::in(['draft', 'submit'])],
                'researcher_name' => [$required, 'string', 'max:150'],
                'proposal_title' => [$required, 'string', 'max:255'],
                'institution' => [$required, 'string', 'max:180'],
                'research_coordinates' => [$required, 'string', 'max:100'],
                'chapter_one' => [$required, 'string'],
                'chapter_two' => [$required, 'string'],
                'chapter_three' => [$required, 'string'],
                'pdf' => [$pdfRequired, 'file', 'mimes:pdf', 'max:5120'],
            ],
            [
                'required' => ':attribute wajib diisi.',
                'max' => ':attribute melebihi batas yang diizinkan.',
                'pdf.mimes' => 'File proposal harus berformat PDF.',
                'pdf.max' => 'Ukuran file proposal maksimal 5 MB.',
            ],
            [
                'researcher_name' => 'Nama peneliti',
                'proposal_title' => 'Judul proposal',
                'institution' => 'Asal universitas/PT',
                'research_coordinates' => 'Koordinat penelitian',
                'chapter_one' => 'BAB I',
                'chapter_two' => 'BAB II',
                'chapter_three' => 'BAB III',
                'pdf' => 'File proposal',
            ],
        );

        $this->ensureWordLimits($validated);

        return $validated;
    }

    private function ensureWordLimits(array $validated): void
    {
        $errors = [];

        foreach (['chapter_one', 'chapter_two', 'chapter_three'] as $field) {
            $words = preg_split('/\s+/u', trim(strip_tags($validated[$field] ?? '')), -1, PREG_SPLIT_NO_EMPTY);
            $wordCount = count($words ?: []);

            if ($wordCount > 300) {
                $errors[$field] = ['Isi bab maksimal 300 kata.'];
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function serialize(ResearchProposal $proposal): array
    {
        return [
            ...$proposal->toArray(),
            'pdf_url' => $proposal->pdf_path
                ? URL::temporarySignedRoute(
                    'research-proposals.pdf',
                    now()->addMinutes(self::PDF_URL_TTL_MINUTES),
                    ['researchProposal' => $proposal->id],
                )
                : null,
            'can_manage' => Gate::allows('update', $proposal),
            'can_review' => Gate::allows('review', $proposal),
        ];
    }

    private function serializeListItem(ResearchProposal $proposal): array
    {
        return [
            'id' => $proposal->id,
            'user_id' => $proposal->user_id,
            'researcher_name' => $proposal->researcher_name,
            'proposal_title' => $proposal->proposal_title,
            'institution' => $proposal->institution,
            'research_coordinates' => $proposal->research_coordinates,
            'pdf_original_name' => $proposal->pdf_original_name,
            'status' => $proposal->status,
            'verification_status' => $proposal->verification_status,
            'review_note' => $proposal->review_note,
            'submitted_at' => $proposal->submitted_at,
            'created_at' => $proposal->created_at,
            'updated_at' => $proposal->updated_at,
            'pdf_url' => $proposal->pdf_path
                ? URL::temporarySignedRoute(
                    'research-proposals.pdf',
                    now()->addMinutes(self::PDF_URL_TTL_MINUTES),
                    ['researchProposal' => $proposal->id],
                )
                : null,
            'can_manage' => Gate::allows('update', $proposal),
            'can_review' => Gate::allows('review', $proposal),
        ];
    }

    private function paginatedResponse($paginator): array
    {
        return [
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
