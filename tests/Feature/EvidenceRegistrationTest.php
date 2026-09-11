<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\IntegrityStatus;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\PhysicalSource;
use App\Models\User;
use App\Services\EvidenceRegistrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EvidenceRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::fake('public');
    }

    public function test_evidence_number_is_generated_in_the_expected_format(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->assertMatchesRegularExpression('/^EV-\d{4}-\d{6}$/', $evidence->evidence_number);
    }

    public function test_registration_creates_a_database_record(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->assertDatabaseHas('evidence', [
            'id' => $evidence->id,
            'evidence_number' => $evidence->evidence_number,
            'title' => 'Seized laptop image',
        ]);
    }

    public function test_the_file_is_stored_on_the_private_disk_and_never_on_public_storage(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->assertSame('local', $evidence->storage_disk);
        Storage::disk('local')->assertExists($evidence->storage_path);
        $this->assertEmpty(Storage::disk('public')->allFiles());
        $this->assertStringNotContainsString('/public/', $evidence->storage_path);
    }

    public function test_sha256_baseline_matches_the_uploaded_files_actual_content(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();
        $content = 'known evidence file content for hashing';

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Log export', 'evidence_type' => EvidenceType::LOG],
            UploadedFile::fake()->createWithContent('access.log', $content),
        );

        $this->assertSame(hash('sha256', $content), $evidence->sha256_baseline);
    }

    public function test_newly_registered_evidence_is_verified_before_the_record_is_committed(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->assertSame(IntegrityStatus::VERIFIED, $evidence->integrity_status);
        $this->assertDatabaseHas('evidence_verifications', [
            'evidence_id' => $evidence->id,
            'baseline_sha256' => $evidence->sha256_baseline,
            'observed_sha256' => $evidence->sha256_baseline,
            'matches_baseline' => true,
            'verified_by' => $registrar->id,
        ]);
    }

    public function test_evidence_belongs_to_the_case_it_was_registered_under(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        $evidence = EvidenceRegistrationService::register(
            $case,
            $registrar,
            ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->assertSame($case->id, $evidence->case_id);
        $this->assertTrue($evidence->case->is($case));
    }

    public function test_a_failed_registration_does_not_leave_an_orphaned_file(): void
    {
        $case = CaseFile::factory()->create();
        $registrar = User::factory()->create();

        // Force the DB insert to fail deterministically, independent of any
        // real constraint, so we can assert the cleanup path runs.
        Evidence::creating(function () {
            throw new \RuntimeException('Simulated database failure.');
        });

        try {
            EvidenceRegistrationService::register(
                $case,
                $registrar,
                ['title' => 'Seized laptop image', 'evidence_type' => EvidenceType::DISK_IMAGE],
                UploadedFile::fake()->create('image.bin', 10),
            );
            $this->fail('Expected registration to throw.');
        } catch (\RuntimeException) {
            // expected
        }

        $this->assertEmpty(Storage::disk('local')->allFiles());
    }

    public function test_a_physical_source_from_a_different_case_is_rejected(): void
    {
        $case = CaseFile::factory()->create();
        $otherCase = CaseFile::factory()->create();
        $foreignSource = PhysicalSource::factory()->create(['case_id' => $otherCase->id]);

        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case->update(['case_manager_id' => $manager->id]);

        $response = $this->actingAs($manager)->post(route('evidence.store', $case), [
            'title' => 'Seized laptop image',
            'evidence_type' => EvidenceType::DISK_IMAGE,
            'physical_source_id' => $foreignSource->id,
            'file' => UploadedFile::fake()->create('image.bin', 10),
        ]);

        $response->assertSessionHasErrors('physical_source_id');
    }

    public function test_a_user_with_no_case_access_cannot_register_evidence(): void
    {
        $case = CaseFile::factory()->create();
        $outsider = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $response = $this->actingAs($outsider)->post(route('evidence.store', $case), [
            'title' => 'Seized laptop image',
            'evidence_type' => EvidenceType::DISK_IMAGE,
            'file' => UploadedFile::fake()->create('image.bin', 10),
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('evidence', 0);
    }

    public function test_an_investigator_assigned_to_the_case_can_register_evidence(): void
    {
        $case = CaseFile::factory()->create();
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $investigator->id,
        ]);

        $response = $this->actingAs($investigator)->post(route('evidence.store', $case), [
            'title' => 'Seized laptop image',
            'evidence_type' => EvidenceType::DISK_IMAGE,
            'file' => UploadedFile::fake()->create('image.bin', 10),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('evidence', ['case_id' => $case->id, 'title' => 'Seized laptop image']);
    }

    public function test_the_integrity_baseline_cannot_be_set_through_the_registration_request(): void
    {
        $case = CaseFile::factory()->create();
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case->update(['case_manager_id' => $manager->id]);

        $response = $this->actingAs($manager)->post(route('evidence.store', $case), [
            'title' => 'Seized laptop image',
            'evidence_type' => EvidenceType::DISK_IMAGE,
            'file' => UploadedFile::fake()->createWithContent('image.bin', 'real content'),
            // Attacker-supplied fields that the Form Request never validates
            // and the service never reads from raw request input.
            'sha256_baseline' => str_repeat('a', 64),
            'integrity_status' => IntegrityStatus::INTEGRITY_FAILURE,
        ]);

        $response->assertRedirect();

        $evidence = Evidence::where('case_id', $case->id)->firstOrFail();

        $this->assertSame(hash('sha256', 'real content'), $evidence->sha256_baseline);
        $this->assertNotSame(str_repeat('a', 64), $evidence->sha256_baseline);
        $this->assertSame(IntegrityStatus::VERIFIED, $evidence->integrity_status);
    }

    public function test_the_evidence_index_only_lists_evidence_from_cases_the_user_can_see(): void
    {
        $visibleCase = CaseFile::factory()->create();
        $hiddenCase = CaseFile::factory()->create();
        $outsider = User::factory()->role(UserRole::INVESTIGATOR)->create();

        CaseAssignment::factory()->create([
            'case_id' => $visibleCase->id,
            'user_id' => $outsider->id,
        ]);

        $visibleEvidence = EvidenceRegistrationService::register(
            $visibleCase,
            $outsider,
            ['title' => 'Visible evidence', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('visible.bin', 10),
        );

        $hiddenEvidence = EvidenceRegistrationService::register(
            $hiddenCase,
            User::factory()->create(),
            ['title' => 'Hidden evidence', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('hidden.bin', 10),
        );

        $response = $this->actingAs($outsider)->get(route('evidence.index'));

        $response->assertOk();
        $evidenceIds = collect($response->original->getData()['page']['props']['evidence']['data'])->pluck('id');

        $this->assertContains($visibleEvidence->id, $evidenceIds);
        $this->assertNotContains($hiddenEvidence->id, $evidenceIds);
    }
}
