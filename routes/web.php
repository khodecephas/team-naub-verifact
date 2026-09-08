<?php

use App\Http\Controllers\CaseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvidenceController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    /*
        Profile
    */
    Route::controller(ProfileController::class)->group(function () {
        Route::get('/profile', 'edit')->name('profile.edit');
        Route::patch('/profile', 'update')->name('profile.update');
        Route::delete('/profile', 'destroy')->name('profile.destroy');
    });

    /*
        Cases
    */
    Route::controller(CaseController::class)->group(function () {
        Route::get('/cases', 'index')->name('cases.index');
        Route::get('/cases/create', 'create')->name('cases.create');
        Route::post('/cases', 'store')->name('cases.store');
        Route::get('/cases/{caseFile}', 'show')->name('cases.show');
        Route::post('/cases/{caseFile}/archive', 'archive')->name('cases.archive');
    });

    /*
        Evidence
    */
    Route::controller(EvidenceController::class)->group(function () {
        Route::get('/evidence', 'index')->name('evidence.index');
        Route::get('/evidence/{evidence}', 'show')->name('evidence.show');
        Route::get('/cases/{caseFile}/evidence/create', 'create')->name('evidence.create');
        Route::post('/cases/{caseFile}/evidence', 'store')->name('evidence.store');
    });
});

require __DIR__.'/auth.php';
