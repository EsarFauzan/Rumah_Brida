<?php

namespace App\Http\Controllers;

use App\Models\ResearchProposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ResearchProposalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'submitted');

        $proposals = ResearchProposal::query()
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest('submitted_at')
            ->latest('created_at')
            ->get()
            ->map(fn (ResearchProposal $proposal) => $this->serialize($proposal));

        return response()->json(['data' => $proposals]);
    }

    public function store(Request $request): JsonResponse
    {
        $isSubmit = $request->input('action') === 'submit';
        $validated = $this->validatePayload($request, $isSubmit, $isSubmit);

        $pdfPath = $request->hasFile('pdf')
            ? $request->file('pdf')->store('research-proposals', 'public')
            : null;

        $proposal = ResearchProposal::create([
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
            'submitted_at' => $isSubmit ? now() : null,
        ]);

        return response()->json([
            'message' => $isSubmit ? 'Proposal berhasil dikirim.' : 'Draft berhasil disimpan.',
            'data' => $this->serialize($proposal),
        ], 201);
    }

    public function show(ResearchProposal $researchProposal): JsonResponse
    {
        return response()->json(['data' => $this->serialize($researchProposal)]);
    }

    public function update(Request $request, ResearchProposal $researchProposal): JsonResponse
    {
        $isSubmit = $request->input('action', $researchProposal->status) !== 'draft';
        $validated = $this->validatePayload($request, $isSubmit, false);
        $oldPdfPath = $researchProposal->pdf_path;

        $data = [
            'researcher_name' => $validated['researcher_name'] ?? null,
            'proposal_title' => $validated['proposal_title'] ?? null,
            'institution' => $validated['institution'] ?? null,
            'research_coordinates' => $validated['research_coordinates'] ?? null,
            'chapter_one' => $validated['chapter_one'] ?? null,
            'chapter_two' => $validated['chapter_two'] ?? null,
            'chapter_three' => $validated['chapter_three'] ?? null,
            'status' => $isSubmit ? 'submitted' : 'draft',
            'submitted_at' => $isSubmit ? ($researchProposal->submitted_at ?? now()) : null,
        ];

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('research-proposals', 'public');
            $data['pdf_original_name'] = $request->file('pdf')->getClientOriginalName();
        }

        $researchProposal->update($data);

        if ($request->hasFile('pdf') && $oldPdfPath) {
            Storage::disk('public')->delete($oldPdfPath);
        }

        return response()->json([
            'message' => 'Proposal berhasil diperbarui.',
            'data' => $this->serialize($researchProposal->fresh()),
        ]);
    }

    public function destroy(ResearchProposal $researchProposal): JsonResponse
    {
        if ($researchProposal->pdf_path) {
            Storage::disk('public')->delete($researchProposal->pdf_path);
        }

        $researchProposal->delete();

        return response()->json(['message' => 'Proposal berhasil dihapus.']);
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
                ? url(Storage::disk('public')->url($proposal->pdf_path))
                : null,
        ];
    }
}
