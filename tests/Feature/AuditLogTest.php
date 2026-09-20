<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\OfflineSyncAttempt;
use App\Models\User;
use App\Services\EvidenceRegistrationService;
use App\Services\EvidenceVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_user_sees_verification_history_for_evidence_they_can_access(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $evidence = EvidenceRegistrationService::register(
            $case, $manager,
            ['title' => 'Seized drive image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );
        EvidenceVerificationService::verify($evidence, $manager);

        $this->actingAs($manager)->get(route('audit.index'))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Audit/Index')
                ->has('verifications', 2)
                ->where('verifications.0.evidence_number', $evidence->evidence_number),
        );
    }

    public function test_user_does_not_see_verifications_for_inaccessible_evidence(): void
    {
        $outsider = CaseFile::factory()->create();
        $registrar = User::factory()->role(UserRole::CASE_MANAGER)->create();
        EvidenceRegistrationService::register(
            $outsider, $registrar,
            ['title' => 'Not my case', 'evidence_type' => EvidenceType::DOCUMENT],
            UploadedFile::fake()->create('doc.pdf', 5),
        );

        $viewer = User::factory()->role(UserRole::CASE_MANAGER)->create();

        $this->actingAs($viewer)->get(route('audit.index'))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Audit/Index')->has('verifications', 0),
        );
    }

    public function test_non_privileged_user_only_sees_their_own_sync_attempts(): void
    {
        $userA = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $userB = User::factory()->role(UserRole::INVESTIGATOR)->create();

        OfflineSyncAttempt::create([
            'offline_collection_id' => (string) Str::uuid(),
            'subject_type' => 'evidence',
            'attempted_by' => $userA->id,
            'outcome' => 'SUCCESS',
            'attempted_at' => now(),
        ]);
        OfflineSyncAttempt::create([
            'offline_collection_id' => (string) Str::uuid(),
            'subject_type' => 'evidence',
            'attempted_by' => $userB->id,
            'outcome' => 'HASH_MISMATCH',
            'attempted_at' => now(),
        ]);

        $this->actingAs($userA)->get(route('audit.index'))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Audit/Index')
                ->has('syncAttempts', 1)
                ->where('syncAttempts.0.attempted_by', $userA->name),
        );
    }

    public function test_administrator_sees_every_sync_attempt(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $userA = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $userB = User::factory()->role(UserRole::INVESTIGATOR)->create();

        OfflineSyncAttempt::create([
            'offline_collection_id' => (string) Str::uuid(),
            'subject_type' => 'evidence',
            'attempted_by' => $userA->id,
            'outcome' => 'SUCCESS',
            'attempted_at' => now(),
        ]);
        OfflineSyncAttempt::create([
            'offline_collection_id' => (string) Str::uuid(),
            'subject_type' => 'evidence',
            'attempted_by' => $userB->id,
            'outcome' => 'HASH_MISMATCH',
            'attempted_at' => now(),
        ]);

        $this->actingAs($admin)->get(route('audit.index'))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Audit/Index')->has('syncAttempts', 2),
        );
    }

    public function test_activity_log_lists_registration_events_for_accessible_evidence(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $evidence = EvidenceRegistrationService::register(
            $case, $manager,
            ['title' => 'Seized drive image', 'evidence_type' => EvidenceType::DISK_IMAGE],
            UploadedFile::fake()->create('image.bin', 10),
        );

        $this->actingAs($manager)->get(route('audit.index'))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Audit/Index')
                ->has('activityEvents', 1)
                ->where('activityEvents.0.event_type', 'EVIDENCE_REGISTERED')
                ->where('activityEvents.0.evidence_number', $evidence->evidence_number),
        );
    }
}
