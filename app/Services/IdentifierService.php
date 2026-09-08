<?php

namespace App\Services;

use App\Enums\IdentifierScope;
use App\Models\IdSequence;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Generates human-readable identifiers (CASE-2026-000001, EV-2026-000001, ...)
 * that stay unique under concurrent requests. Never derive these from
 * Model::count() — two requests can read the same count before either commits.
 */
class IdentifierService
{
    public static function next(IdentifierScope $scope, ?int $year = null): string
    {
        $year ??= (int) now()->year;

        $sequenceValue = DB::transaction(function () use ($scope, $year) {
            $sequence = IdSequence::query()
                ->where('scope', $scope->value)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if ($sequence) {
                $sequence->increment('last_value');

                return $sequence->last_value;
            }

            // No row yet for this scope/year — two requests can race to create
            // it. The unique(scope, year) constraint lets only one INSERT
            // succeed; on MySQL a duplicate-key error doesn't poison the
            // transaction, so the loser just re-reads and locks the winner's row.
            try {
                IdSequence::create([
                    'scope' => $scope->value,
                    'year' => $year,
                    'last_value' => 1,
                ]);

                return 1;
            } catch (QueryException) {
                $sequence = IdSequence::query()
                    ->where('scope', $scope->value)
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->firstOrFail();

                $sequence->increment('last_value');

                return $sequence->last_value;
            }
        });

        return sprintf('%s-%d-%06d', $scope->prefix(), $year, $sequenceValue);
    }
}
