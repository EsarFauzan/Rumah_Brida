<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSuperAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            return response()->json([
                'message' => 'Fitur ini hanya dapat diakses oleh superadmin.',
            ], 403);
        }

        return $next($request);
    }
}
