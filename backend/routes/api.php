<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ResearchProposalController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

Route::get('/research-proposals', [ResearchProposalController::class, 'index']);
Route::get('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'show']);

// Dibuka lewat tab baru browser tanpa bearer token, jadi otorisasinya memakai
// tanda tangan URL sementara yang dibuat saat proposal diserialisasi.
Route::get('/research-proposals/{researchProposal}/pdf', [ResearchProposalController::class, 'pdf'])
    ->middleware('signed')
    ->name('research-proposals.pdf');

Route::middleware(['auth:sanctum', 'throttle:proposal-write'])->group(function () {
    Route::post('/research-proposals', [ResearchProposalController::class, 'store']);
    Route::put('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'update']);
    Route::delete('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'destroy']);
    Route::patch('/admin/research-proposals/{researchProposal}/verification', [ResearchProposalController::class, 'review']);
});

Route::middleware('auth:sanctum')->get('/admin/research-proposals', [ResearchProposalController::class, 'adminIndex']);
