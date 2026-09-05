<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate(
            [
                'name' => ['required', 'string', 'max:150'],
                'email' => ['required', 'string', 'email', 'max:180', 'unique:users,email'],
                'password' => ['required', 'string', 'confirmed', Password::min(8)],
            ],
            [
                'required' => ':attribute wajib diisi.',
                'email' => 'Format :attribute tidak valid.',
                'unique' => ':attribute sudah terdaftar.',
                'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
                'password.min' => 'Kata sandi minimal 8 karakter.',
            ],
            [
                'name' => 'Nama',
                'email' => 'Email',
                'password' => 'Kata sandi',
            ],
        );

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Pendaftaran berhasil.',
            'data' => [
                'user' => $this->serializeUser($user),
                'token' => $user->createToken('rumah-brida')->plainTextToken,
            ],
        ], 201);
    }

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
        ];
    }
}
