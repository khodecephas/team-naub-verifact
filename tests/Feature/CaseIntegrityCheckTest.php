<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\IntegrityStatus;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\User;
use App\Services\EvidenceRegistrationService;
use App\Services\FindingService;
use App\Services\ReportGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CaseIntegrityCheckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_authorized_member_gets_a_fresh_re_verification_of_case_evidence(): void
    {
        [$manager, $case] = $this->context();
        $evidence = EvidenceRegistrationService::register(
            $case, $manager,
            ['title' => 'Seized drive image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $response = $this->actingAs($manager)->postJson(route('cases.integrity-check', $case))->assertOk();

        $result = collect($response->json('evidence'))->firstWhere('evidence_number', $evidence->evidence_number);
        $this->assertTrue($result['checked']);
        $this->assertTrue($result['matches_baseline']);
        $this->assertSame(IntegrityStatus::VERIFIED, $result['integrity_status']);
        $this->assertTrue($result['chain_verified']);
        $this->assertSame(2, $evidence->verifications()->count());
    }

    public function test_role_without_verify_rights_gets_existing_status_without_a_fresh_check(): void
    {
        [$manager, $case] = $this->context();
        $evidence = EvidenceRegistrationService::register(
            $case, $manager,
            ['title' => 'Seized drive image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );
        $auditor = User::factory()->role(UserRole::AUDITOR)->create();

        $response = $this->actingAs($auditor)->postJson(route('cases.integrity-check', $case))->assertOk();

        $result = collect($response->json('evidence'))->firstWhere('evidence_number', $evidence->evidence_number);
        $this->assertFalse($result['checked']);
        $this->assertNull($result['matches_baseline']);
        $this->assertSame(1, $evidence->verifications()->count());
    }

    public function test_reports_a_broken_findings_chain(): void
    {
        [$manager, $case] = $this->context();
        FindingService::record($case, $manager, 'A finding', 'Narrative.');

        $response = $this->actingAs($manager)->postJson(route('cases.integrity-check', $case))->assertOk();
        $this->assertTrue($response->json('findings_chain_verified'));
    }

    public function test_reports_finalized_report_content_verification(): void
    {
        [$manager, $case] = $this->context();
        $evidence = EvidenceRegistrationService::register(
            $case, $manager,
            ['title' => 'Report subject', 'evidence_type' => EvidenceType::DOCUMENT],
            UploadedFile::fake()->create('doc.pdf', 5),
        );
        $draft = ReportGenerationService::createDraft($case, $manager, 'Integrity report', null, [$evidence->id]);
        $final = ReportGenerationService::finalize($draft, $manager);

        $response = $this->actingAs($manager)->postJson(route('cases.integrity-check', $case))->assertOk();

        $reportResult = collect($response->json('reports'))->firstWhere('report_number', $final->report_number);
        $this->assertNotNull($reportResult);
        $this->assertTrue($reportResult['content_verified']);
    }

    public function test_user_without_case_access_cannot_trigger_the_check(): void
    {
        [, $case] = $this->context();
        $outsider = User::factory()->role(UserRole::CASE_MANAGER)->create();

        $this->actingAs($outsider)->postJson(route('cases.integrity-check', $case))->assertForbidden();
    }

    /** @return array{User, CaseFile} */
    private function context(): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $manager->id, 'assigned_by' => $manager->id]);

        return [$manager, $case];
    }
}
