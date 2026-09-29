<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if (! $request->user()?->is_active) {
            return response()->json([
                'message' => 'Akun ini sedang dinonaktifkan.',
            ], 403);
        }

        return $next($request);
    }
}
