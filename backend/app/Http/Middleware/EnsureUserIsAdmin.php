<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if (! $request->user()?->isAdministrator()) {
            return response()->json([
                'message' => 'Akun ini tidak memiliki akses administrator.',
            ], 403);
        }

        return $next($request);
    }
}
