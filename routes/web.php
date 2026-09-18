<?php

use App\Http\Controllers\CaseController;
use App\Http\Controllers\CustodyController;
use App\Http\Controllers\CustodyRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvidenceController;
use App\Http\Controllers\EvidenceVerificationComparisonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SearchController;
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
    Route::get('/search', [SearchController::class, 'index'])->name('search.index');

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
        Route::get('/cases-export.csv', 'export')->name('cases.export');
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
        Route::get('/evidence-export.csv', 'export')->name('evidence.export');
        Route::post('/evidence/batch-verify', 'verifyBatch')->name('evidence.batch-verify');
        Route::get('/evidence/quick-ingest', 'quickCreate')->name('evidence.quick-ingest.create');
        Route::post('/evidence/quick-ingest', 'quickStore')->name('evidence.quick-ingest.store');
        Route::get('/cases/{caseFile}/evidence/create', 'create')->name('evidence.create');
        Route::post('/cases/{caseFile}/evidence', 'store')->name('evidence.store');
        Route::patch('/evidence/{evidence}/complete-intake', 'completeIntake')
            ->name('evidence.intake.complete');
        Route::get('/evidence/{evidence}/file', 'viewFile')->name('evidence.file.view');
        Route::post('/evidence/{evidence}/verify', 'verify')->name('evidence.verify');
        Route::post('/evidence/{evidence}/derivatives', 'issueWorkingCopy')
            ->name('evidence.derivatives.store');
        Route::get('/evidence/{evidence}/derivatives/{derivative}/download', 'downloadDerivative')
            ->name('evidence.derivatives.download');
        Route::post('/evidence/{evidence}/derivatives/{derivative}/revoke', 'revokeDerivative')
            ->name('evidence.derivatives.revoke');
        Route::post('/evidence/{evidence}/custody-transfers', 'transferCustody')
            ->name('evidence.custody-transfers.store');
        Route::get('/evidence/{evidence}', 'show')->name('evidence.show');
    });

    Route::controller(EvidenceVerificationComparisonController::class)->group(function () {
        Route::get('/verify', 'index')->name('verification.index');
        Route::post('/verify/{evidence}/chunks', 'uploadChunk')->name('verification.chunks.store');
        Route::post('/verify/{evidence}/complete', 'completeChunkUpload')->name('verification.chunks.complete');
        Route::post('/verify/{evidence}', 'store')->name('verification.store');
    });

    /*
        Chain of Custody
    */
    Route::get('/custody', [CustodyController::class, 'index'])->name('custody.index');
    Route::controller(CustodyRequestController::class)->group(function () {
        Route::post('/evidence/{evidence}/custody-requests', 'store')->name('custody.requests.store');
        Route::post('/custody/requests/{custodyRequest}/approve', 'approve')->name('custody.requests.approve');
        Route::post('/custody/requests/{custodyRequest}/reject', 'reject')->name('custody.requests.reject');
        Route::post('/custody/requests/{custodyRequest}/cancel', 'cancel')->name('custody.requests.cancel');
    });

    /*
        Non-Technical Reports
    */
    Route::controller(ReportController::class)->group(function () {
        Route::get('/reports', 'index')->name('reports.index');
        Route::get('/reports/create', 'create')->name('reports.create');
        Route::post('/reports', 'store')->name('reports.store');
        Route::get('/reports/{report}/download', 'download')->name('reports.download');
        Route::get('/reports/{report}', 'show')->name('reports.show');
        Route::post('/reports/{report}/finalize', 'finalize')->name('reports.finalize');
    });
});

require __DIR__.'/auth.php';
