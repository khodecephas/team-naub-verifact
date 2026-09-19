<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\PhysicalSourceType;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\OfflineSyncAttempt;
use App\Models\PhysicalSource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class OfflineSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_authorized_case_member_can_sync_offline_evidence(): void
    {
        [$investigator, $case] = $this->context();
        $content = 'offline captured photo bytes';

        $response = $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store', $case),
            $this->payload($content),
        );

        $response->assertOk()->assertJsonPath('outcome', 'SUCCESS');
        $this->assertMatchesRegularExpression('/^EV-\d{4}-\d{6}$/', $response->json('evidence_number'));

        $evidence = Evidence::firstOrFail();
        $this->assertSame('OFFLINE', $evidence->collection_source);
        $this->assertSame(hash('sha256', $content), $evidence->sha256_baseline);
        $this->assertSame(hash('sha256', $content), $evidence->client_sha256);
    }

    public function test_evidence_number_is_server_generated_not_client_supplied(): void
    {
        [$investigator, $case] = $this->context();
        $payload = $this->payload('server generates the identifier');
        // The client payload never includes an evidence number at all.
        $this->assertArrayNotHasKey('evidence_number', $payload);

        $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store', $case), $payload)->assertOk();

        $this->assertMatchesRegularExpression('/^EV-\d{4}-\d{6}$/', Evidence::firstOrFail()->evidence_number);
    }

    public function test_user_without_case_access_cannot_sync_evidence(): void
    {
        [, $case] = $this->context();
        $outsider = User::factory()->role(UserRole::CASE_MANAGER)->create();

        $this->actingAs($outsider)->postJson(
            route('offline-sync.evidence.store', $case),
            $this->payload('unauthorized attempt'),
        )->assertForbidden();

        $this->assertSame(0, Evidence::count());
    }

    public function test_server_independently_calculates_the_hash_and_matching_hashes_succeed(): void
    {
        [$investigator, $case] = $this->context();
        $content = 'content the server will hash itself';

        $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store', $case),
            $this->payload($content, hash('sha256', $content)),
        )->assertOk()->assertJsonPath('outcome', 'SUCCESS');

        $this->assertSame(hash('sha256', $content), Evidence::firstOrFail()->sha256_baseline);
    }

    public function test_hash_mismatch_requires_review_and_does_not_register_evidence(): void
    {
        [$investigator, $case] = $this->context();

        $response = $this->actingAs($investigator)->postJson(
            route('offline-sync.evidence.store', $case),
            $this->payload('actual file content', hash('sha256', 'a different claimed hash')),
        );

        $response->assertStatus(422)->assertJsonPath('outcome', 'HASH_MISMATCH');
        $this->assertSame(0, Evidence::count());
        $this->assertDatabaseHas('offline_sync_attempts', ['outcome' => 'HASH_MISMATCH']);
    }

    public function test_duplicate_sync_retry_does_not_duplicate_evidence(): void
    {
        [$investigator, $case] = $this->context();
        $payload = $this->payload('retried offline record');

        $first = $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store', $case), $payload);
        $second = $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store', $case), $payload);

        $first->assertOk();
        $second->assertOk();
        $this->assertSame($first->json('evidence_number'), $second->json('evidence_number'));
        $this->assertSame(1, Evidence::count());
    }

    public function test_client_collection_time_is_preserved_and_distinct_from_server_sync_time(): void
    {
        [$investigator, $case] = $this->context();
        $collectedAt = now()->subHours(6)->startOfSecond();

        $this->travelTo(now(), function () use ($investigator, $case, $collectedAt) {
            $payload = $this->payload('collected while offline');
            $payload['collected_at'] = $collectedAt->toIso8601String();

            $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store', $case), $payload)->assertOk();
        });

        $evidence = Evidence::firstOrFail();
        $this->assertTrue($evidence->collected_at->equalTo($collectedAt));
        $this->assertTrue(abs($evidence->registered_at->diffInMinutes($collectedAt)) >= 300);
    }

    public function test_failed_authorization_does_not_delete_or_register_local_evidence(): void
    {
        [, $case] = $this->context();
        $outsider = User::factory()->role(UserRole::AUDITOR)->create();

        $this->actingAs($outsider)->postJson(
            route('offline-sync.evidence.store', $case),
            $this->payload('should require review, not deletion'),
        )->assertForbidden();

        $this->assertSame(0, Evidence::count());
        $this->assertSame(0, OfflineSyncAttempt::count());
    }

    public function test_offline_physical_source_syncs_before_dependent_evidence(): void
    {
        [$investigator, $case] = $this->context();
        $offlineSourceId = (string) Str::uuid();

        $sourceResponse = $this->actingAs($investigator)->postJson(
            route('offline-sync.physical-sources.store', $case),
            [
                'offline_collection_id' => $offlineSourceId,
                'label' => 'Seized phone (offline)',
                'source_type' => PhysicalSourceType::MOBILE_PHONE,
            ],
        )->assertOk();

        $realId = $sourceResponse->json('id');
        $payload = $this->payload('evidence from the newly synced source');
        $payload['physical_source_id'] = $realId;

        $this->actingAs($investigator)->postJson(route('offline-sync.evidence.store', $case), $payload)->assertOk();

        $this->assertSame($realId, Evidence::firstOrFail()->physical_source_id);
    }

    public function test_offline_physical_source_sync_is_idempotent(): void
    {
        [$investigator, $case] = $this->context();
        $offlineSourceId = (string) Str::uuid();
        $payload = [
            'offline_collection_id' => $offlineSourceId,
            'label' => 'Seized laptop (offline)',
            'source_type' => PhysicalSourceType::LAPTOP,
        ];

        $first = $this->actingAs($investigator)->postJson(route('offline-sync.physical-sources.store', $case), $payload);
        $second = $this->actingAs($investigator)->postJson(route('offline-sync.physical-sources.store', $case), $payload);

        $first->assertOk();
        $second->assertOk();
        $this->assertSame($first->json('id'), $second->json('id'));
        $this->assertSame(1, PhysicalSource::count());
    }

    public function test_session_endpoint_confirms_an_authenticated_user(): void
    {
        [$investigator] = $this->context();

        $this->actingAs($investigator)->getJson(route('offline-sync.session'))
            ->assertOk()->assertJsonPath('authenticated', true);
    }

    public function test_session_endpoint_returns_json_401_when_not_authenticated(): void
    {
        $this->getJson(route('offline-sync.session'))->assertUnauthorized();
    }

    public function test_bootstrap_only_lists_cases_the_user_may_register_evidence_into(): void
    {
        [$investigator] = $this->context();
        $otherCase = CaseFile::factory()->create();

        $response = $this->actingAs($investigator)->getJson(route('offline-sync.bootstrap'))->assertOk();
        $caseNumbers = collect($response->json('cases'))->pluck('case_number');

        $this->assertNotContains($otherCase->case_number, $caseNumbers);
    }

    public function test_online_evidence_registration_still_works_unaffected(): void
    {
        [$investigator, $case] = $this->context();

        $this->actingAs($investigator)->post(route('evidence.store', $case), [
            'title' => 'Normal online upload',
            'evidence_type' => EvidenceType::DOCUMENT,
            'file' => UploadedFile::fake()->create('report.pdf', 10),
        ])->assertRedirect();

        $evidence = Evidence::firstOrFail();
        $this->assertSame('ONLINE', $evidence->collection_source);
        $this->assertNull($evidence->offline_collection_id);
    }

    /** @return array{User, CaseFile} */
    private function context(): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $investigator->id, 'assigned_by' => $manager->id]);

        return [$investigator, $case];
    }

    /** @return array<string, mixed> */
    private function payload(string $content, ?string $clientSha256 = null): array
    {
        return [
            'offline_collection_id' => (string) Str::uuid(),
            'title' => 'Offline captured evidence',
            'evidence_type' => EvidenceType::IMAGE,
            'client_sha256' => $clientSha256 ?? hash('sha256', $content),
            'collected_at' => now()->subHour()->toIso8601String(),
            'collected_timezone' => 'UTC',
            'file' => UploadedFile::fake()->createWithContent('offline-photo.jpg', $content),
        ];
    }
}
