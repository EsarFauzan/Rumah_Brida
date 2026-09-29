<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create {--name=} {--email=}';

    protected $description = 'Membuat akun administrator Rumah BRIDA secara aman';

    public function handle(): int
    {
        $name = (string) ($this->option('name') ?: $this->ask('Nama administrator'));
        $email = (string) ($this->option('email') ?: $this->ask('Email administrator'));
        $password = (string) $this->secret('Kata sandi');
        $passwordConfirmation = (string) $this->secret('Konfirmasi kata sandi');

        $validator = Validator::make(
            [
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ],
            [
                'name' => ['required', 'string', 'max:150'],
                'email' => ['required', 'string', 'email', 'max:180', 'unique:users,email'],
                'password' => ['required', 'string', 'confirmed', Password::min(8)],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);
        $user->forceFill(['role' => 'admin'])->save();

        $this->info("Administrator {$user->email} berhasil dibuat.");

        return self::SUCCESS;
    }
}
