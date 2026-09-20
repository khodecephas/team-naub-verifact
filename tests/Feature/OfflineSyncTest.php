<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\OfflineSyncAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Offline evidence sync follows Quick Ingest's "secure now, complete
 * details later" path: no case, physical source, or evidence type is
 * collected offline — only the file (plus optional field notes). Case
 * assignment happens afterward, online, from the resulting unassigned
 * evidence record — reusing EvidenceController::completeIntake exactly as
 * Quick Ingest does, so it isn't re-tested here.
 */
class OfflineSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_authorized_registrant_can_sync_offline_evidence(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $content = 'offline captured photo bytes';

        $response = $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload($content),
        );

        $response->assertOk()->assertJsonPath('outcome', 'SUCCESS');
        $this->assertMatchesRegularExpression('/^EV-\d{4}-\d{6}$/', $response->json('evidence_number'));

        $evidence = Evidence::firstOrFail();
        $this->assertSame('OFFLINE', $evidence->collection_source);
        $this->assertNull($evidence->case_id);
        $this->assertSame(hash('sha256', $content), $evidence->sha256_baseline);
        $this->assertSame(hash('sha256', $content), $evidence->client_sha256);
    }

    public function test_evidence_number_is_server_generated_not_client_supplied(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $payload = $this->payload('server generates the identifier');
        // The client payload never includes an evidence number, case, or title at all.
        $this->assertArrayNotHasKey('evidence_number', $payload);
        $this->assertArrayNotHasKey('case_id', $payload);

        $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store'), $payload)->assertOk();

        $this->assertMatchesRegularExpression('/^EV-\d{4}-\d{6}$/', Evidence::firstOrFail()->evidence_number);
    }

    public function test_role_without_registration_rights_cannot_sync_evidence(): void
    {
        $auditor = User::factory()->role(UserRole::AUDITOR)->create();

        $this->actingAs($auditor)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('unauthorized attempt'),
        )->assertForbidden();

        $this->assertSame(0, Evidence::count());
    }

    public function test_server_independently_calculates_the_hash_and_matching_hashes_succeed(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $content = 'content the server will hash itself';

        $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload($content, hash('sha256', $content)),
        )->assertOk()->assertJsonPath('outcome', 'SUCCESS');

        $this->assertSame(hash('sha256', $content), Evidence::firstOrFail()->sha256_baseline);
    }

    public function test_hash_mismatch_requires_review_and_does_not_register_evidence(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $response = $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('actual file content', hash('sha256', 'a different claimed hash')),
        );

        $response->assertStatus(422)->assertJsonPath('outcome', 'HASH_MISMATCH');
        $this->assertSame(0, Evidence::count());
        $this->assertDatabaseHas('offline_sync_attempts', ['outcome' => 'HASH_MISMATCH']);
    }

    public function test_duplicate_sync_retry_does_not_duplicate_evidence(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $payload = $this->payload('retried offline record');

        $first = $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store'), $payload);
        $second = $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store'), $payload);

        $first->assertOk();
        $second->assertOk();
        $this->assertSame($first->json('evidence_number'), $second->json('evidence_number'));
        $this->assertSame(1, Evidence::count());
    }

    public function test_client_collection_time_is_preserved_and_distinct_from_server_sync_time(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $collectedAt = now()->subHours(6)->startOfSecond();

        $this->travelTo(now(), function () use ($investigator, $collectedAt) {
            $payload = $this->payload('collected while offline');
            $payload['collected_at'] = $collectedAt->toIso8601String();

            $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store'), $payload)->assertOk();
        });

        $evidence = Evidence::firstOrFail();
        $this->assertTrue($evidence->collected_at->equalTo($collectedAt));
        $this->assertTrue(abs($evidence->registered_at->diffInMinutes($collectedAt)) >= 300);
    }

    public function test_failed_authorization_does_not_delete_or_register_local_evidence(): void
    {
        $outsider = User::factory()->role(UserRole::AUDITOR)->create();

        $this->actingAs($outsider)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('should require review, not deletion'),
        )->assertForbidden();

        $this->assertSame(0, Evidence::count());
        $this->assertSame(0, OfflineSyncAttempt::count());
    }

    public function test_synced_offline_evidence_can_have_its_case_assigned_afterward(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);

        $sync = $this->actingAs($manager)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('synced offline, assigned later'),
        )->assertOk();

        $evidence = Evidence::where('evidence_number', $sync->json('evidence_number'))->firstOrFail();

        $this->actingAs($manager)->patch(route('evidence.intake.complete', $evidence), [
            'case_id' => $case->id,
            'evidence_type' => EvidenceType::IMAGE,
        ])->assertRedirect();

        $this->assertSame($case->id, $evidence->fresh()->case_id);
    }

    public function test_evidence_status_reports_whether_a_case_has_been_assigned(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);

        $unassigned = $this->actingAs($manager)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('still unassigned'),
        )->assertOk()->json('evidence_number');

        $assigned = $this->actingAs($manager)->postJson(
            route('offline-sync.evidence.store'),
            $this->payload('will be assigned'),
        )->assertOk()->json('evidence_number');

        $this->actingAs($manager)->patch(route('evidence.intake.complete', Evidence::where('evidence_number', $assigned)->firstOrFail()), [
            'case_id' => $case->id,
            'evidence_type' => EvidenceType::IMAGE,
        ])->assertRedirect();

        $response = $this->actingAs($manager)->getJson(
            route('offline-sync.evidence.status', ['evidence_numbers' => [$unassigned, $assigned]]),
        )->assertOk();

        $this->assertFalse($response->json("assignments.{$unassigned}"));
        $this->assertTrue($response->json("assignments.{$assigned}"));
    }

    public function test_session_endpoint_confirms_an_authenticated_user(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $this->actingAs($investigator)->getJson(route('offline-sync.session'))
            ->assertOk()->assertJsonPath('authenticated', true);
    }

    public function test_session_endpoint_returns_json_401_when_not_authenticated(): void
    {
        $this->getJson(route('offline-sync.session'))->assertUnauthorized();
    }

    public function test_bootstrap_only_lists_cases_visible_to_the_user(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $ownCase = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $otherCase = CaseFile::factory()->create();

        $response = $this->actingAs($manager)->getJson(route('offline-sync.bootstrap'))->assertOk();
        $caseNumbers = collect($response->json('cases'))->pluck('case_number');

        $this->assertContains($ownCase->case_number, $caseNumbers);
        $this->assertNotContains($otherCase->case_number, $caseNumbers);
    }

    public function test_online_evidence_registration_still_works_unaffected(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);

        $this->actingAs($manager)->post(route('evidence.store', $case), [
            'title' => 'Normal online upload',
            'evidence_type' => EvidenceType::DOCUMENT,
            'file' => UploadedFile::fake()->create('report.pdf', 10),
        ])->assertRedirect();

        $evidence = Evidence::firstOrFail();
        $this->assertSame('ONLINE', $evidence->collection_source);
        $this->assertNull($evidence->offline_collection_id);
    }

    /** @return array<string, mixed> */
    private function payload(string $content, ?string $clientSha256 = null): array
    {
        return [
            'offline_collection_id' => (string) Str::uuid(),
            'description' => 'Field notes captured on this device.',
            'client_sha256' => $clientSha256 ?? hash('sha256', $content),
            'collected_at' => now()->subHour()->toIso8601String(),
            'collected_timezone' => 'UTC',
            'file' => UploadedFile::fake()->createWithContent('offline-photo.jpg', $content),
        ];
    }
}
