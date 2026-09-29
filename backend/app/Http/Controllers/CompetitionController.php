<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompetitionController extends Controller
{
    private const TYPES = [
        'Lomba untuk ASN',
        'Lomba untuk OPD',
        'Lomba untuk Masyarakat',
    ];

    private const STATUSES = ['open', 'closed'];

    private const GUIDELINE_DISK = 'local';

    public function index(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $paginator = $this->filteredQuery($filters)
            ->latest('opening_date')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 9)
            ->through(fn (Competition $competition) => $this->serialize($competition));

        return response()->json($this->paginatedResponse($paginator));
    }

    public function options(): JsonResponse
    {
        $today = now()->toDateString();
        $competitions = Competition::query()
            ->where('status', 'open')
            ->whereDate('opening_date', '<=', $today)
            ->whereDate('closing_date', '>=', $today)
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (Competition $competition) => [
                'id' => $competition->id,
                'code' => $competition->code,
                'name' => $competition->name,
                'type' => $competition->type,
            ]);

        return response()->json([
            'data' => $competitions,
            'types' => self::TYPES,
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Competition::class);
        $filters = $this->validateFilters($request, 50);
        $paginator = $this->filteredQuery($filters)
            ->latest('opening_date')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->through(fn (Competition $competition) => $this->serialize($competition));

        return response()->json([
            ...$this->paginatedResponse($paginator),
            'counts' => [
                'total' => Competition::count(),
                'open' => Competition::where('status', 'open')->count(),
                'closed' => Competition::where('status', 'closed')->count(),
            ],
            'options' => ['types' => self::TYPES],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Competition::class);
        $validated = $this->validatePayload($request);
        $file = $request->file('guideline');
        $validated['user_id'] = $request->user()->id;
        $validated['guideline_path'] = $file->store('competition-guidelines', self::GUIDELINE_DISK);
        $validated['guideline_original_name'] = $file->getClientOriginalName();

        $competition = Competition::create($validated);

        return response()->json([
            'message' => 'Data lomba berhasil disimpan.',
            'data' => $this->serialize($competition),
        ], 201);
    }

    public function update(Request $request, Competition $competition): JsonResponse
    {
        Gate::authorize('update', $competition);
        $validated = $this->validatePayload($request, $competition);
        $oldGuideline = $competition->guideline_path;

        if ($request->hasFile('guideline')) {
            $file = $request->file('guideline');
            $validated['guideline_path'] = $file->store('competition-guidelines', self::GUIDELINE_DISK);
            $validated['guideline_original_name'] = $file->getClientOriginalName();
        }

        $competition->update($validated);

        if ($request->hasFile('guideline') && $oldGuideline) {
            Storage::disk(self::GUIDELINE_DISK)->delete($oldGuideline);
        }

        return response()->json([
            'message' => 'Data lomba berhasil diperbarui.',
            'data' => $this->serialize($competition->fresh()),
        ]);
    }

    public function destroy(Competition $competition): JsonResponse
    {
        Gate::authorize('delete', $competition);

        if ($competition->guideline_path) {
            Storage::disk(self::GUIDELINE_DISK)->delete($competition->guideline_path);
        }
        $competition->delete();

        return response()->json(['message' => 'Data lomba berhasil dihapus.']);
    }

    public function guideline(Competition $competition): StreamedResponse
    {
        abort_unless(
            $competition->guideline_path && Storage::disk(self::GUIDELINE_DISK)->exists($competition->guideline_path),
            404,
        );

        return Storage::disk(self::GUIDELINE_DISK)->response(
            $competition->guideline_path,
            $competition->guideline_original_name,
            [
                'Content-Type' => 'application/pdf',
                'X-Content-Type-Options' => 'nosniff',
                'Content-Security-Policy' => "default-src 'none'; sandbox",
            ],
        );
    }

    private function validatePayload(Request $request, ?Competition $competition = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('competitions', 'code')->ignore($competition?->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:3000'],
            'opening_date' => ['required', 'date'],
            'closing_date' => ['required', 'date', 'after_or_equal:opening_date'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'type' => ['required', Rule::in(self::TYPES)],
            'guideline' => [$competition ? 'nullable' : 'required', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'closing_date.after_or_equal' => 'Tanggal penutupan tidak boleh sebelum tanggal pembukaan.',
        ]);
    }

    private function validateFilters(Request $request, int $maxPerPage = 20): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'type' => ['nullable', Rule::in(self::TYPES)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.$maxPerPage],
        ]);
    }

    private function filteredQuery(array $filters)
    {
        $search = trim($filters['search'] ?? '');

        return Competition::query()
            ->when($search !== '', fn ($query) => $query->where(function ($inner) use ($search) {
                $inner->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->when(isset($filters['type']), fn ($query) => $query->where('type', $filters['type']));
    }

    private function serialize(Competition $competition): array
    {
        return [
            'id' => $competition->id,
            'code' => $competition->code,
            'name' => $competition->name,
            'description' => $competition->description,
            'opening_date' => $competition->opening_date?->format('Y-m-d'),
            'closing_date' => $competition->closing_date?->format('Y-m-d'),
            'status' => $competition->status,
            'type' => $competition->type,
            'is_registration_open' => $competition->status === 'open'
                && $competition->opening_date?->startOfDay()->lessThanOrEqualTo(now()->startOfDay())
                && $competition->closing_date?->endOfDay()->greaterThanOrEqualTo(now()->startOfDay()),
            'guideline_original_name' => $competition->guideline_original_name,
            'guideline_url' => route('competitions.guideline', $competition),
            'created_at' => $competition->created_at?->toISOString(),
            'updated_at' => $competition->updated_at?->toISOString(),
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
