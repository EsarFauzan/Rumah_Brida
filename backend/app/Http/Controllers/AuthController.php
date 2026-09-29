<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate(
            [
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ],
            [
                'required' => ':attribute wajib diisi.',
                'email' => 'Format :attribute tidak valid.',
            ],
            [
                'email' => 'Email',
                'password' => 'Kata sandi',
            ],
        );

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi salah.'],
            ]);
        }

        if (! $user->isAdministrator()) {
            return response()->json([
                'message' => 'Akun ini tidak memiliki akses administrator.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun administrator ini sedang dinonaktifkan.',
            ], 403);
        }

        return response()->json([
            'message' => 'Berhasil masuk.',
            'data' => [
                'user' => $this->serializeUser($user),
                'token' => $user->createToken('rumah-brida')->plainTextToken,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->serializeUser($request->user())]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
        ];
    }
}
