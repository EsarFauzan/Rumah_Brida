<?php

use App\Http\Controllers\AdministratorController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompetitionController;
use App\Http\Controllers\CompetitionRegistrationController;
use App\Http\Controllers\InnovationController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\ResearchProposalController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('active');
});

Route::get('/research-proposals', [ResearchProposalController::class, 'index']);
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{slug}', [NewsController::class, 'show']);
Route::get('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'show']);
Route::get('/competitions', [CompetitionController::class, 'index']);
Route::get('/competitions/options', [CompetitionController::class, 'options']);
Route::post('/competitions/{competition}/registrations', [CompetitionRegistrationController::class, 'store'])
    ->middleware('throttle:competition-registration');
Route::get('/competitions/{competition}/guideline', [CompetitionController::class, 'guideline'])
    ->name('competitions.guideline');

// Dibuka lewat tab baru browser tanpa bearer token, jadi otorisasinya memakai
// tanda tangan URL sementara yang dibuat saat proposal diserialisasi.
Route::get('/research-proposals/{researchProposal}/pdf', [ResearchProposalController::class, 'pdf'])
    ->middleware('signed')
    ->name('research-proposals.pdf');

Route::middleware(['auth:sanctum', 'active', 'throttle:proposal-write'])->group(function () {
    Route::post('/research-proposals', [ResearchProposalController::class, 'store']);
    Route::put('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'update']);
    Route::delete('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'destroy']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'admin'])->group(function () {
    Route::get('/news', [NewsController::class, 'adminIndex']);
    Route::post('/news', [NewsController::class, 'store'])->middleware('throttle:news-write');
    Route::put('/news/{news}', [NewsController::class, 'update'])->middleware('throttle:news-write');
    Route::delete('/news/{news}', [NewsController::class, 'destroy'])->middleware('throttle:news-write');

    Route::get('/competitions', [CompetitionController::class, 'adminIndex']);
    Route::post('/competitions', [CompetitionController::class, 'store'])->middleware('throttle:competition-write');
    Route::put('/competitions/{competition}', [CompetitionController::class, 'update'])->middleware('throttle:competition-write');
    Route::delete('/competitions/{competition}', [CompetitionController::class, 'destroy'])->middleware('throttle:competition-write');

    Route::middleware(['superadmin', 'throttle:administrator-write'])->group(function () {
        Route::get('/administrators', [AdministratorController::class, 'index']);
        Route::post('/administrators', [AdministratorController::class, 'store']);
        Route::put('/administrators/{administrator}', [AdministratorController::class, 'update']);
        Route::patch('/administrators/{administrator}/password', [AdministratorController::class, 'updatePassword']);
        Route::patch('/administrators/{administrator}/status', [AdministratorController::class, 'updateStatus']);
    });
});

Route::get('/innovations/options', [InnovationController::class, 'options']);
Route::get('/innovations', [InnovationController::class, 'index']);
Route::get('/innovations/{innovation}', [InnovationController::class, 'show']);
Route::get('/innovations/{innovation}/pdf/{kind}', [InnovationController::class, 'pdf'])
    ->where('kind', 'profile|report');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/innovations', [InnovationController::class, 'store']);
    Route::put('/innovations/{innovation}', [InnovationController::class, 'update']);
    Route::delete('/innovations/{innovation}', [InnovationController::class, 'destroy']);
});
