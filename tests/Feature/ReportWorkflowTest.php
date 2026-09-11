<?php

namespace Tests\Feature;

use App\Enums\IntegrityStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\EvidenceVerification;
use App\Models\Report;
use App\Models\ReportDownload;
use App\Models\User;
use App\Services\EvidenceCustodyService;
use App\Services\ReportGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class ReportWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_case_manager_can_create_a_report_draft(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();

        $response = $this->actingAs($manager)->post(route('reports.store'), [
            'case_id' => $case->id,
            'evidence_ids' => [$evidence->id],
            'title' => 'Plain-language integrity report',
            'introduction' => 'Prepared for supervisory review.',
        ]);

        $report = Report::firstOrFail();
        $response->assertRedirect(route('reports.show', $report));
        $this->assertSame(ReportStatus::DRAFT, $report->status);
        $this->assertSame([$evidence->id], $report->evidence_ids);
    }

    public function test_report_numbers_use_the_public_report_sequence(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();

        $report = $this->draft($manager, $case, $evidence);

        $this->assertMatchesRegularExpression('/^RPT-\d{4}-\d{6}$/', $report->report_number);
    }

    public function test_each_report_receives_a_unique_number(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();

        $first = $this->draft($manager, $case, $evidence);
        $second = $this->draft($manager, $case, $evidence, 'Second report');

        $this->assertNotSame($first->report_number, $second->report_number);
    }

    public function test_report_requires_at_least_one_evidence_item(): void
    {
        [$manager, $case] = $this->reportContext();

        $this->expectException(ValidationException::class);
        ReportGenerationService::createDraft($case, $manager, 'Empty report', null, []);
    }

    public function test_selected_evidence_must_belong_to_the_selected_case(): void
    {
        [$manager, $case] = $this->reportContext();
        $otherCase = CaseFile::factory()->create();
        $otherEvidence = Evidence::factory()->create(['case_id' => $otherCase->id]);

        $this->expectException(ValidationException::class);
        ReportGenerationService::createDraft($case, $manager, 'Invalid report', null, [$otherEvidence->id]);
    }

    public function test_draft_snapshot_contains_only_selected_evidence(): void
    {
        [$manager, $case, $selected] = $this->reportContext();
        Evidence::factory()->create(['case_id' => $case->id, 'registered_by' => $manager->id]);

        $report = $this->draft($manager, $case, $selected);

        $this->assertCount(1, $report->snapshot['evidence']);
        $this->assertSame($selected->evidence_number, $report->snapshot['evidence'][0]['evidence_number']);
    }

    public function test_baseline_only_evidence_is_not_described_as_verified(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();

        $statement = $this->draft($manager, $case, $evidence)->snapshot['evidence'][0]['verification']['statement'];

        $this->assertStringContainsString('fingerprint was established', strtolower($statement));
        $this->assertStringContainsString('No later verification', $statement);
    }

    public function test_matching_verification_uses_careful_plain_language(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        EvidenceVerification::factory()->create(['evidence_id' => $evidence->id, 'verified_by' => $manager->id]);

        $statement = $this->draft($manager, $case, $evidence)->snapshot['evidence'][0]['verification']['statement'];

        $this->assertStringContainsString('No later change was detected', $statement);
        $this->assertStringNotContainsString('authentic', strtolower($statement));
    }

    public function test_integrity_mismatch_is_prominent_in_snapshot_and_conclusion(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $evidence->update(['integrity_status' => IntegrityStatus::INTEGRITY_FAILURE]);
        EvidenceVerification::factory()->create([
            'evidence_id' => $evidence->id,
            'verified_by' => $manager->id,
            'observed_sha256' => str_repeat('a', 64),
            'matches_baseline' => false,
        ]);

        $snapshot = $this->draft($manager, $case, $evidence)->snapshot;

        $this->assertTrue($snapshot['evidence'][0]['integrity_warning']);
        $this->assertStringContainsString('further review', $snapshot['conclusion']);
    }

    public function test_finalization_freezes_snapshot_and_creates_content_hash(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();

        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $this->assertSame(ReportStatus::FINAL, $report->status);
        $this->assertNotNull($report->finalized_at);
        $this->assertSame(64, strlen($report->report_sha256));
        $this->assertTrue($report->hasValidContentHash());
    }

    public function test_report_hash_is_deterministic_for_equivalent_snapshot_keys(): void
    {
        $first = ['report' => ['title' => 'A', 'status' => 'FINAL'], 'case' => ['number' => '1']];
        $second = ['case' => ['number' => '1'], 'report' => ['status' => 'FINAL', 'title' => 'A']];

        $this->assertSame(ReportGenerationService::hashSnapshot($first), ReportGenerationService::hashSnapshot($second));
    }

    public function test_later_source_changes_do_not_change_a_final_snapshot(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);
        $snapshot = $report->snapshot;

        $case->update(['title' => 'Changed source case']);
        $evidence->update(['title' => 'Changed source evidence']);

        $this->assertSame($snapshot, $report->fresh()->snapshot);
    }

    public function test_final_report_content_cannot_be_changed_through_the_model(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $this->expectException(LogicException::class);
        $report->update(['title' => 'Rewritten final report']);
    }

    public function test_tampering_is_detected_by_the_content_hash(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);
        $snapshot = $report->snapshot;
        $snapshot['conclusion'] = 'Tampered conclusion';

        DB::table('reports')->where('id', $report->id)->update(['snapshot' => json_encode($snapshot)]);

        $this->assertFalse($report->fresh()->hasValidContentHash());
    }

    public function test_new_final_report_can_supersede_an_earlier_final_report(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $original = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);
        $replacement = ReportGenerationService::createDraft($case, $manager, 'Replacement', null, [$evidence->id], [], $original);

        $replacement = ReportGenerationService::finalize($replacement, $manager);

        $this->assertSame(ReportStatus::SUPERSEDED, $original->fresh()->status);
        $this->assertSame($replacement->id, $original->fresh()->superseded_by);
        $this->assertSame($original->id, $replacement->supersedes_report_id);
    }

    public function test_unassigned_user_cannot_create_report_for_hidden_case(): void
    {
        [, $case, $evidence] = $this->reportContext();
        $outsider = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $this->actingAs($outsider)->post(route('reports.store'), [
            'case_id' => $case->id,
            'evidence_ids' => [$evidence->id],
            'title' => 'Unauthorized report',
        ])->assertForbidden();
    }

    public function test_case_manager_can_finalize_own_case_report(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = $this->draft($manager, $case, $evidence);

        $this->actingAs($manager)->post(route('reports.finalize', $report))->assertSessionHas('success');

        $this->assertSame(ReportStatus::FINAL, $report->fresh()->status);
    }

    public function test_non_manager_cannot_finalize_case_report(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $case->assignments()->create([
            'user_id' => $investigator->id,
            'role_on_case' => 'Investigator',
            'assigned_by' => $manager->id,
            'assigned_at' => now(),
        ]);
        $report = $this->draft($manager, $case, $evidence);

        $this->actingAs($investigator)->post(route('reports.finalize', $report))->assertForbidden();
    }

    public function test_draft_report_cannot_be_downloaded(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = $this->draft($manager, $case, $evidence);

        $this->actingAs($manager)->get(route('reports.download', $report))->assertForbidden();
    }

    public function test_final_report_download_is_a_named_pdf(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $response = $this->actingAs($manager)->get(route('reports.download', $report));

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Content-Disposition', 'attachment; filename='.$report->report_number.'.pdf');
        $this->assertStringStartsWith('%PDF-', $response->streamedContent());
        $this->assertDatabaseHas('report_downloads', [
            'report_id' => $report->id,
            'downloaded_by' => $manager->id,
            'delivery_type' => 'DOWNLOAD',
        ]);
    }

    public function test_print_copy_is_streamed_and_recorded_in_delivery_history(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $response = $this->actingAs($manager)->get(route('reports.download', [$report, 'mode' => 'print']));

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Content-Disposition', 'inline; filename="'.$report->report_number.'-print.pdf"');
        $this->assertStringStartsWith('%PDF-', $response->streamedContent());
        $this->assertDatabaseHas('report_downloads', [
            'report_id' => $report->id,
            'downloaded_by' => $manager->id,
            'delivery_type' => 'PRINT',
        ]);
    }

    public function test_altered_final_report_download_is_blocked(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);
        DB::table('reports')->where('id', $report->id)->update(['report_sha256' => str_repeat('0', 64)]);

        $this->actingAs($manager)->get(route('reports.download', $report))
            ->assertRedirect(route('reports.show', $report))
            ->assertSessionHas('error', 'Download blocked: this finalized report no longer matches the fingerprint recorded when it was finalized.');
        $this->assertDatabaseCount('report_downloads', 0);
    }

    public function test_technical_details_are_opt_in_on_preview(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $this->actingAs($manager)->get(route('reports.show', $report))
            ->assertInertia(fn (Assert $page) => $page->where('report.technical_details', null));
        $this->actingAs($manager)->get(route('reports.show', [$report, 'appendix' => 1]))
            ->assertInertia(fn (Assert $page) => $page->has('report.technical_details.evidence', 1));
    }

    public function test_auditor_can_read_and_download_final_report(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $auditor = User::factory()->role(UserRole::AUDITOR)->create();
        $report = ReportGenerationService::finalize($this->draft($manager, $case, $evidence), $manager);

        $this->actingAs($auditor)->get(route('reports.show', $report))->assertOk();
        $this->actingAs($auditor)->get(route('reports.download', $report))->assertOk();
    }

    public function test_report_register_filters_by_search_status_case_and_delivery(): void
    {
        [$manager, $case, $evidence] = $this->reportContext();
        $final = ReportGenerationService::finalize($this->draft($manager, $case, $evidence, 'Needle report'), $manager);
        $this->draft($manager, $case, $evidence, 'Unrelated draft');
        ReportDownload::create([
            'report_id' => $final->id,
            'downloaded_by' => $manager->id,
            'delivery_type' => 'DOWNLOAD',
            'included_technical_appendix' => false,
            'downloaded_at' => now(),
        ]);

        $this->actingAs($manager)->get(route('reports.index', [
            'search' => 'Needle',
            'status' => ReportStatus::FINAL,
            'case' => $case->case_number,
            'downloaded' => 'yes',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('reports.data', 1)
            ->where('reports.data.0.report_number', $final->report_number)
            ->where('reports.data.0.downloads_count', 1)
            ->where('filters.status', ReportStatus::FINAL));
    }

    /** @return array{User, CaseFile, Evidence} */
    private function reportContext(): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['case_manager_id' => $manager->id, 'created_by' => $manager->id]);
        $evidence = Evidence::factory()->create([
            'case_id' => $case->id,
            'registered_by' => $manager->id,
            'current_custodian_id' => $manager->id,
        ]);
        EvidenceCustodyService::recordInitialCustody($evidence, $manager);

        return [$manager, $case, $evidence];
    }

    private function draft(User $manager, CaseFile $case, Evidence $evidence, string $title = 'Digital Evidence Integrity Report'): Report
    {
        return ReportGenerationService::createDraft($case, $manager, $title, null, [$evidence->id]);
    }
}
