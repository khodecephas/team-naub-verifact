<?php

namespace Tests\Feature;

use App\Enums\EvidenceDerivativeStatus;
use App\Enums\EvidenceType;
use App\Enums\IntegrityStatus;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\PhysicalSource;
use App\Models\User;
use App\Services\EvidenceActivityEventService;
use App\Services\EvidenceDerivativeService;
use App\Services\EvidenceRegistrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class EvidenceOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authorised_user_can_verify_evidence_that_matches_its_baseline(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('known master content');

        $response = $this->actingAs($manager)->post(route('evidence.verify', $evidence));

        $response->assertRedirect();
        $this->assertSame(IntegrityStatus::VERIFIED, $evidence->refresh()->integrity_status);
        $this->assertDatabaseHas('evidence_verifications', [
            'evidence_id' => $evidence->id,
            'baseline_sha256' => hash('sha256', 'known master content'),
            'observed_sha256' => hash('sha256', 'known master content'),
            'matches_baseline' => true,
            'verified_by' => $manager->id,
        ]);
    }

    public function test_an_authorised_user_can_open_the_evidence_comparison_workspace(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('comparison baseline');

        $response = $this->actingAs($manager)->get(route('verification.index', [
            'evidence' => $evidence->evidence_number,
        ]));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Evidence/Verify')
            ->where('selectedEvidenceNumber', $evidence->evidence_number)
            ->has('evidenceOptions', 1)
            ->where('evidenceOptions.0.sha256_baseline', $evidence->sha256_baseline));
    }

    public function test_an_authorised_user_can_compare_an_uploaded_file_with_a_registered_baseline(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('comparison baseline');

        $response = $this->actingAs($manager)->post(route('verification.store', $evidence), [
            'file' => UploadedFile::fake()->createWithContent('comparison.bin', 'comparison baseline'),
        ]);

        $response->assertRedirect(route('verification.index', [
            'evidence' => $evidence->evidence_number,
        ]));
        $response->assertSessionHas('verification_result.matches', true);
        $this->assertDatabaseHas('evidence_verifications', [
            'evidence_id' => $evidence->id,
            'observed_sha256' => hash('sha256', 'comparison baseline'),
            'matches_baseline' => true,
            'verification_method' => 'UPLOADED_COMPARISON',
            'comparison_filename' => 'comparison.bin',
            'verified_by' => $manager->id,
        ]);
    }

    public function test_evidence_comparison_records_a_non_matching_payload_without_changing_the_baseline(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('comparison baseline');
        $baseline = $evidence->sha256_baseline;

        $response = $this->actingAs($manager)->post(route('verification.store', $evidence), [
            'file' => UploadedFile::fake()->createWithContent('different.bin', 'different payload'),
        ]);

        $response->assertSessionHas('verification_result.matches', false);
        $this->assertDatabaseHas('evidence_verifications', [
            'evidence_id' => $evidence->id,
            'observed_sha256' => hash('sha256', 'different payload'),
            'matches_baseline' => false,
            'verification_method' => 'UPLOADED_COMPARISON',
        ]);
        $this->assertSame($baseline, $evidence->refresh()->sha256_baseline);
    }

    public function test_verification_records_an_integrity_failure_when_the_master_file_changes(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('original content');
        Storage::disk('local')->put($evidence->storage_path, 'changed content');

        $response = $this->actingAs($manager)->post(route('evidence.verify', $evidence));

        $response->assertRedirect();
        $this->assertSame(IntegrityStatus::INTEGRITY_FAILURE, $evidence->refresh()->integrity_status);
        $this->assertDatabaseHas('evidence_verifications', [
            'evidence_id' => $evidence->id,
            'matches_baseline' => false,
            'observed_sha256' => hash('sha256', 'changed content'),
        ]);
    }

    public function test_an_investigator_cannot_run_an_integrity_verification(): void
    {
        Storage::fake('local');
        [, $evidence, $case] = $this->evidenceForManager('master content');
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $investigator->id,
        ]);

        $response = $this->actingAs($investigator)->post(route('evidence.verify', $evidence));

        $response->assertForbidden();
        $this->assertCount(1, $evidence->verifications);
    }

    public function test_a_missing_master_file_returns_a_controlled_verification_error(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('master content');
        Storage::disk('local')->delete($evidence->storage_path);

        $response = $this->actingAs($manager)
            ->from(route('evidence.show', $evidence))
            ->post(route('evidence.verify', $evidence));

        $response->assertRedirect(route('evidence.show', $evidence));
        $response->assertSessionHas('error', 'Integrity verification could not run because the master evidence file is unavailable.');
        $this->assertSame(IntegrityStatus::VERIFICATION_REQUIRED, $evidence->refresh()->integrity_status);
        $this->assertCount(1, $evidence->verifications);
    }

    public function test_a_missing_master_file_returns_a_controlled_view_error(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('master content');
        Storage::disk('local')->delete($evidence->storage_path);

        $response = $this->actingAs($manager)
            ->from(route('evidence.show', $evidence))
            ->get(route('evidence.file.view', $evidence));

        $response->assertRedirect(route('evidence.show', $evidence));
        $response->assertSessionHas('error', 'The master evidence file is unavailable in controlled storage.');
    }

    public function test_quick_ingest_requires_only_a_file_and_creates_verified_unassigned_evidence(): void
    {
        Storage::fake('local');
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();

        $response = $this->actingAs($manager)->post(route('evidence.quick-ingest.store'), [
            'file' => UploadedFile::fake()->createWithContent('body-camera-clip.mp4', 'video bytes'),
            'title' => 'Attacker supplied title',
            'case_id' => 999,
        ]);

        $evidence = Evidence::firstOrFail();
        $response->assertRedirect(route('evidence.show', $evidence));
        $this->assertNull($evidence->case_id);
        $this->assertSame('body-camera-clip', $evidence->title);
        $this->assertSame(EvidenceType::OTHER, $evidence->evidence_type);
        $this->assertSame(IntegrityStatus::VERIFIED, $evidence->integrity_status);
        Storage::disk('local')->assertExists($evidence->storage_path);
        $this->assertCount(1, $evidence->verifications);
    }

    public function test_unassigned_evidence_can_be_completed_and_attached_without_changing_its_title(): void
    {
        Storage::fake('local');
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create([
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);
        $source = PhysicalSource::factory()->create(['case_id' => $case->id]);
        $evidence = EvidenceRegistrationService::registerUnassigned(
            $manager,
            UploadedFile::fake()->createWithContent('mobile-export.zip', 'archive bytes'),
        );

        $response = $this->actingAs($manager)->patch(route('evidence.intake.complete', $evidence), [
            'case_id' => $case->id,
            'physical_source_id' => $source->id,
            'evidence_type' => EvidenceType::ARCHIVE,
            'description' => 'Collected during authorised mobile extraction.',
            'title' => 'Changed title',
        ]);

        $response->assertRedirect();
        $evidence->refresh();
        $this->assertSame($case->id, $evidence->case_id);
        $this->assertSame($source->id, $evidence->physical_source_id);
        $this->assertSame(EvidenceType::ARCHIVE, $evidence->evidence_type);
        $this->assertSame('Collected during authorised mobile extraction.', $evidence->description);
        $this->assertSame('mobile-export', $evidence->title);
    }

    public function test_an_authorised_user_can_view_the_master_but_cannot_download_it(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('master file bytes');

        $viewResponse = $this->actingAs($manager)->get(route('evidence.file.view', $evidence));
        $viewResponse->assertOk();
        $this->assertStringContainsString('inline', (string) $viewResponse->headers->get('content-disposition'));
        $this->assertFalse(Route::has('evidence.download'));
        $this->actingAs($manager)->get("/evidence/{$evidence->evidence_number}/download")->assertNotFound();
    }

    public function test_a_user_without_case_access_cannot_view_the_master_file(): void
    {
        Storage::fake('local');
        [, $evidence] = $this->evidenceForManager('restricted master file');
        $outsider = User::factory()->role(UserRole::ANALYST)->create();

        $response = $this->actingAs($outsider)->get(route('evidence.file.view', $evidence));

        $response->assertForbidden();
    }

    public function test_an_authorised_user_can_issue_a_uniquely_identified_working_copy(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('copy source bytes');

        $response = $this->issueWorkingCopy($manager, $evidence, 'Forensic examination');

        $response->assertRedirect();
        $derivative = $evidence->derivatives()->firstOrFail();
        $this->assertMatchesRegularExpression('/^DER-\d{4}-\d{6}$/', $derivative->derivative_number);
        $this->assertSame($evidence->id, $derivative->evidence_id);
        $this->assertSame(hash('sha256', 'copy source bytes'), $derivative->sha256);
        $this->assertSame(EvidenceDerivativeStatus::AVAILABLE, $derivative->status);
        Storage::disk('local')->assertExists($derivative->storage_path);
    }

    public function test_downloading_a_working_copy_records_history_and_removes_only_the_binary(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('downloadable copy');
        $this->issueWorkingCopy($manager, $evidence, 'Review');
        $derivative = $evidence->derivatives()->firstOrFail();

        $response = $this->actingAs($manager)->get(
            route('evidence.derivatives.download', [$evidence, $derivative]),
        );

        $response->assertDownload();
        $this->assertSame('downloadable copy', $response->streamedContent());
        $this->assertSame(EvidenceDerivativeStatus::DOWNLOADED, $derivative->refresh()->status);
        $this->assertNotNull($derivative->downloaded_at);
        Storage::disk('local')->assertMissing($derivative->storage_path);
        $this->assertDatabaseHas('evidence_derivatives', ['id' => $derivative->id]);
        $this->assertDatabaseHas('evidence_activity_events', [
            'subject_id' => $derivative->id,
            'event_type' => 'WORKING_COPY_DOWNLOADED',
        ]);
    }

    public function test_a_working_copy_cannot_be_downloaded_through_another_evidence_record(): void
    {
        Storage::fake('local');
        [$manager, $evidence, $case] = $this->evidenceForManager('first evidence');
        $otherEvidence = EvidenceRegistrationService::register(
            $case,
            $manager,
            ['title' => 'Other evidence', 'evidence_type' => EvidenceType::DOCUMENT],
            UploadedFile::fake()->createWithContent('other.txt', 'other evidence'),
        );
        $this->issueWorkingCopy($manager, $evidence, 'Review');
        $derivative = $evidence->derivatives()->firstOrFail();

        $response = $this->actingAs($manager)->get(
            route('evidence.derivatives.download', [$otherEvidence, $derivative]),
        );

        $response->assertNotFound();
        $this->assertSame(EvidenceDerivativeStatus::AVAILABLE, $derivative->refresh()->status);
    }

    public function test_master_integrity_failure_blocks_working_copy_issuance(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('original master');
        Storage::disk('local')->put($evidence->storage_path, 'tampered master');

        $response = $this->issueWorkingCopy($manager, $evidence, 'Analysis');

        $response->assertSessionHas('error');
        $this->assertSame(IntegrityStatus::INTEGRITY_FAILURE, $evidence->refresh()->integrity_status);
        $this->assertDatabaseCount('evidence_derivatives', 0);
    }

    public function test_an_unauthorised_user_cannot_issue_a_working_copy(): void
    {
        Storage::fake('local');
        [$manager, $evidence, $case] = $this->evidenceForManager('master');
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $investigator->id,
            'assigned_by' => $manager->id,
        ]);

        $this->issueWorkingCopy($investigator, $evidence, 'Unapproved analysis')->assertForbidden();
        $this->assertDatabaseCount('evidence_derivatives', 0);
    }

    public function test_an_expired_working_copy_cannot_be_downloaded_and_its_record_remains(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('expiring copy');
        $this->issueWorkingCopy($manager, $evidence, 'Time-limited review');
        $derivative = $evidence->derivatives()->firstOrFail();
        $derivative->update(['expires_at' => now()->subMinute()]);

        $response = $this->actingAs($manager)
            ->from(route('evidence.show', $evidence))
            ->get(route('evidence.derivatives.download', [$evidence, $derivative]));

        $response->assertRedirect(route('evidence.show', $evidence));
        $this->assertSame(EvidenceDerivativeStatus::EXPIRED, $derivative->refresh()->status);
        Storage::disk('local')->assertMissing($derivative->storage_path);
        $this->assertDatabaseHas('evidence_derivatives', ['id' => $derivative->id]);
    }

    public function test_a_revoked_working_copy_cannot_be_downloaded(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('revoked copy');
        $this->issueWorkingCopy($manager, $evidence, 'Review');
        $derivative = $evidence->derivatives()->firstOrFail();
        EvidenceDerivativeService::revoke($derivative, $manager);

        $response = $this->actingAs($manager)->get(
            route('evidence.derivatives.download', [$evidence, $derivative]),
        );

        $response->assertRedirect();
        $this->assertSame(EvidenceDerivativeStatus::REVOKED, $derivative->refresh()->status);
        Storage::disk('local')->assertMissing($derivative->storage_path);
    }

    public function test_each_working_copy_issuance_creates_a_new_derivative_identifier(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('repeatable source');

        $this->issueWorkingCopy($manager, $evidence, 'First review');
        $this->issueWorkingCopy($manager, $evidence, 'Second review');

        $numbers = $evidence->derivatives()->pluck('derivative_number');
        $this->assertCount(2, $numbers);
        $this->assertCount(2, $numbers->unique());
    }

    public function test_working_copy_storage_is_private_and_uses_server_generated_paths(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('private derivative');
        $this->issueWorkingCopy($manager, $evidence, 'Review');
        $derivative = $evidence->derivatives()->firstOrFail();

        $this->assertSame(config('evidence.disk'), $derivative->storage_disk);
        $this->assertStringContainsString(
            "/derivatives/{$derivative->derivative_number}/working-copy",
            $derivative->storage_path,
        );
        $this->assertStringNotContainsString('public/', $derivative->storage_path);
        $this->assertStringNotContainsString($evidence->original_filename, $derivative->storage_path);
    }

    public function test_derivative_event_chain_detects_historical_mutation(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('chain protected');
        $this->issueWorkingCopy($manager, $evidence, 'Audit review');
        $derivative = $evidence->derivatives()->firstOrFail();

        $this->assertTrue(EvidenceActivityEventService::verifyChain($derivative));
        $derivative->events()->oldest('id')->firstOrFail()->update([
            'payload' => ['purpose' => 'Mutated history'],
        ]);
        $this->assertFalse(EvidenceActivityEventService::verifyChain($derivative));
    }

    public function test_working_copy_operations_never_change_the_master_baseline(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('immutable baseline');
        $baseline = $evidence->sha256_baseline;
        $this->issueWorkingCopy($manager, $evidence, 'Review');
        $derivative = $evidence->derivatives()->firstOrFail();
        EvidenceDerivativeService::revoke($derivative, $manager);

        $this->assertSame($baseline, $evidence->refresh()->sha256_baseline);
    }

    public function test_custody_can_be_transferred_to_personnel_assigned_to_the_case(): void
    {
        Storage::fake('local');
        [$manager, $evidence, $case] = $this->evidenceForManager('custody file');
        $custodian = User::factory()->role(UserRole::EVIDENCE_CUSTODIAN)->create();
        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $custodian->id,
            'assigned_by' => $manager->id,
        ]);

        $manager->update(['role' => UserRole::EVIDENCE_CUSTODIAN]);
        $response = $this->actingAs($manager)->post(route('evidence.custody-transfers.store', $evidence), [
            'to_custodian_id' => $custodian->id,
            'purpose' => 'Forensic examination',
            'to_location' => 'Laboratory 2',
            'notes' => 'Seal inspected before transfer.',
        ]);

        $response->assertRedirect();
        $evidence->refresh();
        $this->assertSame($custodian->id, $evidence->current_custodian_id);
        $this->assertSame('Laboratory 2', $evidence->current_custody_location);
        $this->assertDatabaseHas('evidence_custody_events', [
            'evidence_id' => $evidence->id,
            'from_custodian_id' => $manager->id,
            'to_custodian_id' => $custodian->id,
            'transferred_by' => $manager->id,
            'purpose' => 'Forensic examination',
        ]);
    }

    public function test_custody_cannot_be_transferred_to_an_unassigned_user(): void
    {
        Storage::fake('local');
        [$manager, $evidence] = $this->evidenceForManager('custody file');
        $manager->update(['role' => UserRole::EVIDENCE_CUSTODIAN]);
        $outsider = User::factory()->role(UserRole::EVIDENCE_CUSTODIAN)->create();

        $response = $this->actingAs($manager)
            ->from(route('evidence.show', $evidence))
            ->post(route('evidence.custody-transfers.store', $evidence), [
                'to_custodian_id' => $outsider->id,
                'purpose' => 'Forensic examination',
            ]);

        $response->assertRedirect(route('evidence.show', $evidence));
        $response->assertSessionHasErrors([
            'to_custodian_id' => 'The selected custodian is not assigned to this case.',
        ]);
        $this->assertSame($manager->id, $evidence->refresh()->current_custodian_id);
        $this->assertDatabaseCount('evidence_custody_events', 1);
    }

    /**
     * @return TestResponse<Response>
     */
    private function issueWorkingCopy(User $actor, Evidence $evidence, string $purpose): TestResponse
    {
        return $this->actingAs($actor)->post(route('evidence.derivatives.store', $evidence), [
            'issued_to' => $actor->id,
            'purpose' => $purpose,
            'retention_minutes' => 60,
        ]);
    }

    /**
     * @return array{User, Evidence, CaseFile}
     */
    private function evidenceForManager(string $content): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create([
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);
        $evidence = EvidenceRegistrationService::register(
            $case,
            $manager,
            [
                'title' => 'Forensic disk image',
                'evidence_type' => EvidenceType::DISK_IMAGE,
            ],
            UploadedFile::fake()->createWithContent('disk-image.bin', $content),
        );

        return [$manager, $evidence, $case];
    }
}
