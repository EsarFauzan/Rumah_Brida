<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CompetitionRegistrationController extends Controller
{
    public function store(Request $request, Competition $competition): JsonResponse
    {
        if (! $this->isRegistrationOpen($competition)) {
            throw ValidationException::withMessages([
                'competition_id' => 'Pendaftaran untuk lomba ini sedang tidak dibuka.',
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => [
                'required',
                'string',
                'regex:/^\d{16}$/',
                Rule::unique('competition_registrations', 'nik')
                    ->where(fn ($query) => $query->where('competition_id', $competition->id)),
            ],
            'address' => ['required', 'string', 'max:1000'],
            'product_name' => ['required', 'string', 'max:255'],
        ], [
            'nik.regex' => 'NIK harus terdiri dari tepat 16 digit angka.',
            'nik.unique' => 'NIK ini sudah terdaftar pada lomba yang dipilih.',
        ]);

        $registration = $competition->registrations()->create($validated);

        return response()->json([
            'message' => 'Pendaftaran lomba berhasil dikirim.',
            'data' => [
                'id' => $registration->id,
                'competition_id' => $competition->id,
                'competition_name' => $competition->name,
            ],
        ], 201);
    }

    private function isRegistrationOpen(Competition $competition): bool
    {
        $today = now()->startOfDay();

        return $competition->status === 'open'
            && $competition->opening_date?->startOfDay()->lessThanOrEqualTo($today)
            && $competition->closing_date?->endOfDay()->greaterThanOrEqualTo($today);
    }
}
