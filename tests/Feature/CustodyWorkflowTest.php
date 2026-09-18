<?php

namespace Tests\Feature;

use App\Enums\CustodyRequestStatus;
use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;
use App\Services\CustodyRequestService;
use App\Services\EvidenceCustodyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CustodyWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_member_can_submit_a_custody_request(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $this->actingAs($requester)->post(route('custody.requests.store', $evidence), [
            'purpose' => 'Forensic examination',
            'requested_location' => 'Lab 4',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('custody_requests', [
            'evidence_id' => $evidence->id, 'requested_by' => $requester->id,
            'current_custodian_id' => $holder->id, 'status' => CustodyRequestStatus::PENDING,
        ]);
    }

    public function test_request_does_not_change_current_custody(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        CustodyRequestService::create($evidence, $requester, 'Examination', 'Lab');
        $this->assertSame($holder->id, $evidence->refresh()->current_custodian_id);
        $this->assertDatabaseCount('evidence_custody_events', 1);
    }

    public function test_current_holder_cannot_request_the_same_evidence(): void
    {
        [$holder, , $evidence] = $this->custodyContext();
        $this->actingAs($holder)->post(route('custody.requests.store', $evidence), [
            'purpose' => 'Keep custody',
        ])->assertForbidden();
    }

    public function test_non_case_member_cannot_request_custody(): void
    {
        [, , $evidence] = $this->custodyContext();
        $outsider = User::factory()->role(UserRole::ANALYST)->create();
        $this->actingAs($outsider)->post(route('custody.requests.store', $evidence), [
            'purpose' => 'Review',
        ])->assertForbidden();
    }

    public function test_duplicate_pending_request_is_rejected(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        CustodyRequestService::create($evidence, $requester, 'First', null);
        $this->actingAs($requester)->post(route('custody.requests.store', $evidence), [
            'purpose' => 'Second',
        ])->assertSessionHas('error');
        $this->assertDatabaseCount('custody_requests', 1);
    }

    public function test_custody_request_requires_a_clear_purpose(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        $this->actingAs($requester)->post(route('custody.requests.store', $evidence), [
            'purpose' => '',
        ])->assertSessionHasErrors('purpose');
        $this->assertDatabaseCount('custody_requests', 0);
    }

    public function test_current_holder_can_approve_and_transfer_atomically(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', 'Lab 2');
        $this->actingAs($holder)->post(route('custody.requests.approve', $request))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSame($requester->id, $evidence->refresh()->current_custodian_id);
        $this->assertSame(CustodyRequestStatus::APPROVED, $request->refresh()->status);
        $this->assertDatabaseHas('evidence_custody_events', [
            'custody_request_id' => $request->id, 'from_custodian_id' => $holder->id,
            'to_custodian_id' => $requester->id, 'transfer_method' => 'REQUEST_APPROVED',
        ]);
    }

    public function test_rejection_persists_without_changing_custody(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $this->actingAs($holder)->post(route('custody.requests.reject', $request), [
            'review_notes' => 'Evidence is still in active use.',
        ])->assertSessionHas('success');

        $this->assertSame($holder->id, $evidence->refresh()->current_custodian_id);
        $this->assertSame(CustodyRequestStatus::REJECTED, $request->refresh()->status);
        $this->assertDatabaseCount('evidence_custody_events', 1);
    }

    public function test_non_holder_cannot_review_a_request(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $other = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $this->actingAs($other)->post(route('custody.requests.approve', $request))->assertForbidden();
    }

    public function test_administrator_can_review_a_request(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $this->actingAs($admin)->post(route('custody.requests.approve', $request))->assertSessionHas('success');
        $this->assertSame($requester->id, $evidence->refresh()->current_custodian_id);
    }

    public function test_stale_request_cannot_transfer_custody(): void
    {
        [$holder, $requester, $evidence, $case] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $replacement = $this->assignedUser($case, $holder, UserRole::EVIDENCE_CUSTODIAN);
        $evidence->update(['current_custodian_id' => $replacement->id]);

        $this->expectException(\DomainException::class);
        CustodyRequestService::approve($request, $holder, null);
    }

    public function test_requester_removed_from_case_cannot_receive_custody(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        CaseAssignment::query()->where('user_id', $requester->id)->delete();
        $this->expectException(\DomainException::class);
        CustodyRequestService::approve($request, $holder, null);
    }

    public function test_reviewed_request_cannot_be_approved_twice(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        CustodyRequestService::approve($request, $holder, null);
        $this->expectException(\DomainException::class);
        CustodyRequestService::approve($request, $holder, null);
    }

    public function test_requester_can_cancel_a_pending_request(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $this->actingAs($requester)->post(route('custody.requests.cancel', $request))->assertSessionHas('success');
        $this->assertSame(CustodyRequestStatus::CANCELLED, $request->refresh()->status);
    }

    public function test_another_user_cannot_cancel_a_request(): void
    {
        [, $requester, $evidence] = $this->custodyContext();
        $request = CustodyRequestService::create($evidence, $requester, 'Examination', null);
        $other = User::factory()->role(UserRole::ANALYST)->create();
        $this->actingAs($other)->post(route('custody.requests.cancel', $request))->assertForbidden();
    }

    public function test_case_manager_cannot_use_privileged_direct_transfer(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $manager = $evidence->case->caseManager;
        $this->actingAs($manager)->post(route('evidence.custody-transfers.store', $evidence), [
            'to_custodian_id' => $requester->id, 'purpose' => 'Direct',
        ])->assertForbidden();
        $this->assertSame($holder->id, $evidence->refresh()->current_custodian_id);
    }

    public function test_evidence_custodian_can_use_privileged_direct_transfer(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $this->actingAs($holder)->post(route('evidence.custody-transfers.store', $evidence), [
            'to_custodian_id' => $requester->id, 'purpose' => 'Administrative handoff',
        ])->assertSessionHas('success');
        $this->assertSame($requester->id, $evidence->refresh()->current_custodian_id);
    }

    public function test_direct_transfer_rejects_unassigned_recipient(): void
    {
        [$holder, , $evidence] = $this->custodyContext();
        $outsider = User::factory()->role(UserRole::ANALYST)->create();
        $this->actingAs($holder)->post(route('evidence.custody-transfers.store', $evidence), [
            'to_custodian_id' => $outsider->id, 'purpose' => 'Administrative handoff',
        ])->assertSessionHasErrors('to_custodian_id');
    }

    public function test_initial_registration_event_starts_a_valid_chain(): void
    {
        [, , $evidence] = $this->custodyContext();
        $event = $evidence->custodyEvents()->firstOrFail();
        $this->assertSame(1, $event->sequence_number);
        $this->assertNull($event->previous_event_hash);
        $this->assertTrue(EvidenceCustodyService::verifyChain($evidence));
    }

    public function test_multiple_transfers_increment_sequence_and_link_hashes(): void
    {
        [$holder, $requester, $evidence, $case] = $this->custodyContext();
        EvidenceCustodyService::transfer($evidence, $requester, $holder, ['purpose' => 'First']);
        $third = $this->assignedUser($case, $holder, UserRole::ANALYST);
        EvidenceCustodyService::transfer($evidence->refresh(), $third, $holder, ['purpose' => 'Second']);
        $events = $evidence->custodyEvents()->oldest('sequence_number')->get();
        $this->assertSame([1, 2, 3], $events->pluck('sequence_number')->all());
        $this->assertSame($events[1]->event_hash, $events[2]->previous_event_hash);
        $this->assertTrue(EvidenceCustodyService::verifyChain($evidence));
    }

    public function test_database_tampering_breaks_chain_verification(): void
    {
        [, , $evidence] = $this->custodyContext();
        DB::table('evidence_custody_events')->where('evidence_id', $evidence->id)->update(['purpose' => 'Changed']);
        $this->assertFalse(EvidenceCustodyService::verifyChain($evidence));
    }

    public function test_model_updates_to_custody_events_are_blocked(): void
    {
        [, , $evidence] = $this->custodyContext();
        $this->expectException(\LogicException::class);
        $evidence->custodyEvents()->firstOrFail()->update(['purpose' => 'Changed']);
    }

    public function test_model_deletes_of_custody_events_are_blocked(): void
    {
        [, , $evidence] = $this->custodyContext();
        $this->expectException(\LogicException::class);
        $evidence->custodyEvents()->firstOrFail()->delete();
    }

    public function test_custody_transfer_never_changes_the_evidence_file_baseline(): void
    {
        [$holder, $requester, $evidence] = $this->custodyContext();
        $baseline = $evidence->sha256_baseline;
        EvidenceCustodyService::transfer($evidence, $requester, $holder, ['purpose' => 'Examination']);
        $this->assertSame($baseline, $evidence->refresh()->sha256_baseline);
    }

    public function test_case_show_page_includes_its_chain_of_custody(): void
    {
        [$holder, , $evidence, $case] = $this->custodyContext();
        $this->actingAs($holder)->get(route('cases.show', $case))->assertOk()->assertInertia(
            fn ($page) => $page->component('Cases/Show')
                ->has('custody.holdings', 1)
                ->where('custody.holdings.0.evidence_number', $evidence->evidence_number)
                ->where('custody.holdings.0.chain_verified', true),
        );
    }

    /** @return array{User, User, Evidence, CaseFile} */
    private function custodyContext(): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $holder = User::factory()->role(UserRole::EVIDENCE_CUSTODIAN)->create();
        $requester = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $holder->id, 'assigned_by' => $manager->id]);
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $requester->id, 'assigned_by' => $manager->id]);
        $evidence = Evidence::factory()->create([
            'case_id' => $case->id, 'registered_by' => $holder->id,
            'current_custodian_id' => $holder->id, 'current_custody_location' => 'Vault A',
        ]);
        EvidenceCustodyService::recordInitialCustody($evidence, $holder);

        return [$holder, $requester, $evidence, $case];
    }

    private function assignedUser(CaseFile $case, User $actor, string $role): User
    {
        $user = User::factory()->role($role)->create();
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $user->id, 'assigned_by' => $actor->id]);

        return $user;
    }
}
