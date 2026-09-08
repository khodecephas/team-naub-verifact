<?php

namespace Tests\Feature;

use App\Enums\PhysicalSourceType;
use App\Models\CaseFile;
use App\Models\PhysicalSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhysicalSourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_physical_source_belongs_to_its_case(): void
    {
        $case = CaseFile::factory()->create();

        $source = PhysicalSource::factory()->create([
            'case_id' => $case->id,
            'source_type' => PhysicalSourceType::HARD_DRIVE,
            'label' => 'HD-001',
        ]);

        $this->assertTrue($source->case->is($case));
        $this->assertSame(PhysicalSourceType::HARD_DRIVE, $source->source_type);
    }

    public function test_a_case_can_have_multiple_physical_sources(): void
    {
        $case = CaseFile::factory()->create();

        PhysicalSource::factory()->count(3)->create(['case_id' => $case->id]);

        $this->assertCount(3, $case->fresh()->physicalSources);
    }
}
