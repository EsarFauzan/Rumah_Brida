<?php

namespace App\Http\Controllers;

use App\Models\Innovation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class InnovationController extends Controller
{
    private const INNOVATION_TYPES = [
        'Inovasi Daerah Lainnya',
        'Inovasi Pelayanan Publik',
        'Inovasi Tata Kelola Pemerintahan Daerah',
    ];

    private const GOVERNMENT_AFFAIRS = [
        'Pendidikan',
        'Kesehatan',
        'Trantibum Linmas',
        'Sosial',
        'Pelayanan Umum dan Tata Ruang',
        'Perumahan Rakyat dan Kawasan Permukiman',
        'Urusan Pemerintahan Lainnya',
    ];

    public function options()
    {
        return response()->json([
            'innovation_types' => self::INNOVATION_TYPES,
            'government_affairs' => self::GOVERNMENT_AFFAIRS,
        ]);
    }

    public function index(Request $request)
    {
        $query = Innovation::query()->with('user:id,name')->latest();

        return response()->json([
            'data' => $query->paginate(10),
        ]);
    }

    public function show(Innovation $innovation)
    {
        return response()->json(['data' => $innovation->load('user:id,name')]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $validated['user_id'] = $request->user()->id;

        if ($request->hasFile('profile_pdf')) {
            $file = $request->file('profile_pdf');
            $validated['profile_pdf_path'] = $file->store('innovations/profile', 'public');
            $validated['profile_pdf_original_name'] = $file->getClientOriginalName();
        }

        if ($request->hasFile('report_pdf')) {
            $file = $request->file('report_pdf');
            $validated['report_pdf_path'] = $file->store('innovations/report', 'public');
            $validated['report_pdf_original_name'] = $file->getClientOriginalName();
        }

        $innovation = Innovation::create($validated);

        return response()->json([
            'message' => 'Data inovasi berhasil disimpan.',
            'data' => $innovation,
        ], 201);
    }

    public function update(Request $request, Innovation $innovation)
    {
        if ($innovation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah data ini.'], 403);
        }

        $validated = $this->validatePayload($request);

        if ($request->hasFile('profile_pdf')) {
            if ($innovation->profile_pdf_path) {
                Storage::disk('public')->delete($innovation->profile_pdf_path);
            }
            $file = $request->file('profile_pdf');
            $validated['profile_pdf_path'] = $file->store('innovations/profile', 'public');
            $validated['profile_pdf_original_name'] = $file->getClientOriginalName();
        }

        if ($request->hasFile('report_pdf')) {
            if ($innovation->report_pdf_path) {
                Storage::disk('public')->delete($innovation->report_pdf_path);
            }
            $file = $request->file('report_pdf');
            $validated['report_pdf_path'] = $file->store('innovations/report', 'public');
            $validated['report_pdf_original_name'] = $file->getClientOriginalName();
        }

        $innovation->update($validated);

        return response()->json([
            'message' => 'Data inovasi berhasil diperbarui.',
            'data' => $innovation,
        ]);
    }

    public function destroy(Request $request, Innovation $innovation)
    {
        if ($innovation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak berhak menghapus data ini.'], 403);
        }

        if ($innovation->profile_pdf_path) {
            Storage::disk('public')->delete($innovation->profile_pdf_path);
        }
        if ($innovation->report_pdf_path) {
            Storage::disk('public')->delete($innovation->report_pdf_path);
        }

        $innovation->delete();

        return response()->json(['message' => 'Data inovasi berhasil dihapus.']);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'innovator_name' => ['required', 'string', 'max:255'],
            'innovation_type' => ['required', Rule::in(self::INNOVATION_TYPES)],
            'government_affair' => ['required', Rule::in(self::GOVERNMENT_AFFAIRS)],
            'trial_date' => ['nullable', 'date'],
            'implementation_date' => ['nullable', 'date'],
            'ratification_date' => ['nullable', 'date'],
            'profile_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'report_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'reporting_year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);
    }
}