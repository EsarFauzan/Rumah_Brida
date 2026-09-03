<?php

use App\Http\Controllers\ResearchProposalController;
use Illuminate\Support\Facades\Route;

Route::get('/research-proposals', [ResearchProposalController::class, 'index']);
Route::post('/research-proposals', [ResearchProposalController::class, 'store']);
Route::get('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'show']);
Route::put('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'update']);
Route::delete('/research-proposals/{researchProposal}', [ResearchProposalController::class, 'destroy']);
