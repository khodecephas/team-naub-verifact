<?php

namespace Tests\Feature;

use App\Enums\IdentifierScope;
use App\Models\IdSequence;
use App\Services\IdentifierService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdentifierServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_formats_the_identifier_with_prefix_year_and_padded_sequence(): void
    {
        $identifier = IdentifierService::next(IdentifierScope::CASE_FILE(), 2026);

        $this->assertSame('CASE-2026-000001', $identifier);
    }

    public function test_it_increments_sequentially_within_the_same_scope_and_year(): void
    {
        $first = IdentifierService::next(IdentifierScope::EVIDENCE(), 2026);
        $second = IdentifierService::next(IdentifierScope::EVIDENCE(), 2026);
        $third = IdentifierService::next(IdentifierScope::EVIDENCE(), 2026);

        $this->assertSame('EV-2026-000001', $first);
        $this->assertSame('EV-2026-000002', $second);
        $this->assertSame('EV-2026-000003', $third);
    }

    public function test_different_scopes_do_not_share_a_sequence(): void
    {
        IdentifierService::next(IdentifierScope::CASE_FILE(), 2026);
        $evidence = IdentifierService::next(IdentifierScope::EVIDENCE(), 2026);

        $this->assertSame('EV-2026-000001', $evidence);
    }

    public function test_different_years_do_not_share_a_sequence(): void
    {
        IdentifierService::next(IdentifierScope::CASE_FILE(), 2025);
        $next = IdentifierService::next(IdentifierScope::CASE_FILE(), 2026);

        $this->assertSame('CASE-2026-000001', $next);
    }

    public function test_repeated_generation_never_produces_duplicate_identifiers(): void
    {
        $identifiers = [];

        for ($i = 0; $i < 50; $i++) {
            $identifiers[] = IdentifierService::next(IdentifierScope::REPORT(), 2026);
        }

        $this->assertCount(50, array_unique($identifiers));
    }

    public function test_the_scope_and_year_pair_is_protected_by_a_database_unique_constraint(): void
    {
        IdSequence::create(['scope' => 'case', 'year' => 2026, 'last_value' => 1]);

        $this->expectException(QueryException::class);

        IdSequence::create(['scope' => 'case', 'year' => 2026, 'last_value' => 1]);
    }
}
