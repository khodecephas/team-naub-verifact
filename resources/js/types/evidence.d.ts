export interface EvidenceCaseSummary {
    id: number;
    case_number: string;
    title: string;
}

export interface EvidencePhysicalSourceSummary {
    id: number;
    label: string;
}

export interface EvidenceRegisteredBySummary {
    id: number;
    name: string;
}

export interface EvidencePersonSummary {
    id: number;
    name: string;
    role?: string;
}

/** Shape produced by App\Http\Resources\EvidenceResource. */
export interface Evidence {
    id: number;
    evidence_number: string;
    title: string;
    description: string | null;
    evidence_type: string;
    original_filename: string;
    mime_type: string | null;
    file_extension: string | null;
    file_size_bytes: number;
    sha256_baseline: string;
    integrity_status: string;
    registered_at: string;
    collection_source: string;
    collected_at: string | null;
    collected_timezone: string | null;
    client_sha256: string | null;
    case?: EvidenceCaseSummary | null;
    physical_source?: EvidencePhysicalSourceSummary | null;
    registered_by?: EvidenceRegisteredBySummary;
    current_custodian?: EvidencePersonSummary | null;
    current_custody_location?: string | null;
}

export interface EvidenceVerification {
    id: number;
    baseline_sha256: string;
    observed_sha256: string;
    matches_baseline: boolean;
    verified_at: string;
    verified_by: string;
}

export interface EvidenceCustodyEvent {
    id: number;
    from_custodian: string | null;
    to_custodian: string;
    transferred_by: string;
    purpose: string;
    from_location: string | null;
    to_location: string | null;
    notes: string | null;
    action: string;
    transfer_method: string;
    sequence_number: number;
    occurred_at: string;
}

export interface EvidenceCustodyRequest {
    id: number;
    requester: string;
    current_custodian: string;
    requested_location: string | null;
    purpose: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    reviewer: string | null;
    review_notes: string | null;
    created_at: string;
    can_review: boolean;
    can_cancel: boolean;
}

export type EvidenceDerivativeStatus =
    "AVAILABLE" | "DOWNLOADED" | "EXPIRED" | "REVOKED";

export interface EvidenceDerivativeEvent {
    event_type: string;
    actor: string;
    occurred_at: string;
    event_hash: string;
    previous_event_hash: string | null;
}

export interface EvidenceDerivative {
    derivative_number: string;
    derivative_type: string;
    original_filename: string | null;
    mime_type: string | null;
    file_size_bytes: number;
    sha256: string;
    status: EvidenceDerivativeStatus;
    created_by: string;
    issued_to: string | null;
    purpose: string | null;
    created_at: string;
    issued_at: string | null;
    downloaded_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    can_download: boolean;
    can_revoke: boolean;
    events: EvidenceDerivativeEvent[];
}

export interface EvidencePermissions {
    viewFile: boolean;
    verify: boolean;
    issueWorkingCopy: boolean;
    requestCustody: boolean;
    reviewCustodyRequests: boolean;
    directTransferCustody: boolean;
    isCurrentCustodian: boolean;
    completeIntake: boolean;
}

export interface EvidenceIntakeCase {
    id: number;
    case_number: string;
    title: string;
    physical_sources: EvidencePhysicalSourceSummary[];
}

export interface VerificationEvidenceOption {
    id: number;
    evidence_number: string;
    title: string;
    evidence_type: string;
    original_filename: string;
    file_size_bytes: number;
    sha256_baseline: string;
    integrity_status: string;
    registered_at: string;
    registered_by: EvidenceRegisteredBySummary | null;
    case: EvidenceCaseSummary | null;
}

export interface FileVerificationResult {
    verification_id: number;
    matches: boolean;
    evidence_number: string;
    evidence_title: string;
    baseline_sha256: string;
    observed_sha256: string;
    comparison_filename: string;
    comparison_file_size_bytes: number;
    verified_at: string;
}

/** One entry from the evidence's hash-chained activity ledger (EvidenceActivityEventService). */
export interface EvidenceActivityLogEntry {
    id: number;
    event_type: string;
    actor: string;
    payload: Record<string, unknown>;
    occurred_at: string;
}

export interface PaginatedEvidence {
    data: Evidence[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}
