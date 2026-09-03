<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Rumah Brida',
        'status' => 'ready',
        'message' => 'Backend siap dikembangkan dari awal.',
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Rumah Brida API',
    ]);
});
