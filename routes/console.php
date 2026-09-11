<?php

use App\Services\EvidenceDerivativeService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('evidence:expire-derivatives', function () {
    $expired = EvidenceDerivativeService::expireDue();

    $this->info("Expired {$expired} working-copy binaries.");
})->purpose('Expire working-copy binaries whose availability window has ended');

Schedule::command('evidence:expire-derivatives')->everyMinute()->withoutOverlapping();
