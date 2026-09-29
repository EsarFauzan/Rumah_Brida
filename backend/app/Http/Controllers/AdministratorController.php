<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdministratorController extends Controller
{
    public function index(): JsonResponse
    {
        $administrators = User::query()
            ->whereIn('role', ['admin', 'superadmin'])
            ->orderByRaw("CASE WHEN role = 'superadmin' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->serialize($user));

        return response()->json(['data' => $administrators]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->accountRules());

        $administrator = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);
        $administrator->forceFill([
            'role' => 'admin',
            'is_active' => true,
        ])->save();

        return response()->json([
            'message' => 'Administrator berhasil dibuat.',
            'data' => $this->serialize($administrator),
        ], 201);
    }

    public function update(Request $request, User $administrator): JsonResponse
    {
        $this->ensureManageableAdmin($administrator);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'required',
                'string',
                'email',
                'max:180',
                Rule::unique('users', 'email')->ignore($administrator->id),
            ],
        ]);

        $administrator->update($validated);

        return response()->json([
            'message' => 'Administrator berhasil diperbarui.',
            'data' => $this->serialize($administrator->fresh()),
        ]);
    }

    public function updatePassword(Request $request, User $administrator): JsonResponse
    {
        $this->ensureManageableAdmin($administrator);

        $validated = $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        $administrator->update([
            'password' => Hash::make($validated['password']),
        ]);
        $administrator->tokens()->delete();

        return response()->json([
            'message' => 'Kata sandi administrator berhasil diubah. Semua sesi lama telah dicabut.',
        ]);
    }

    public function updateStatus(Request $request, User $administrator): JsonResponse
    {
        if ($request->user()->is($administrator)) {
            return response()->json([
                'message' => 'Akun superadmin yang sedang digunakan tidak dapat dinonaktifkan.',
            ], 422);
        }

        $this->ensureManageableAdmin($administrator);
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $administrator->forceFill(['is_active' => $validated['is_active']])->save();

        if (! $administrator->is_active) {
            $administrator->tokens()->delete();
        }

        return response()->json([
            'message' => $administrator->is_active
                ? 'Administrator berhasil diaktifkan kembali.'
                : 'Administrator berhasil dinonaktifkan dan seluruh sesinya telah dicabut.',
            'data' => $this->serialize($administrator),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function accountRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ];
    }

    private function ensureManageableAdmin(User $administrator): void
    {
        abort_unless(
            $administrator->role === 'admin',
            403,
            'Akun superadmin dan researcher legacy tidak dapat dikelola melalui panel ini.',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
