export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';

export interface CaseSummary {
    id: number;
    case_number: string;
    title: string;
    status: CaseStatus;
    case_manager: string | null;
    priority: string | null;
    matter_category: string | null;
    docket_reference: string | null;
    judicial_authority: string | null;
    discovery_deadline: string | null;
    evidence_count: number;
    updated_at: string;
}

export interface CaseDetail {
    id: number;
    case_number: string;
    title: string;
    description: string | null;
    status: CaseStatus;
    opened_at: string | null;
    closed_at: string | null;
    creator: string | null;
    case_manager: string | null;
    closer: string | null;
}

export interface CasePersonnel {
    id: number;
    /** Null for the case-manager row, which isn't a removable CaseAssignment. */
    assignment_id: number | null;
    name: string;
    system_role: string;
    case_role: string;
    assigned_at: string | null;
    assigned_by: string | null;
}

export interface AssignableUser {
    id: number;
    name: string;
    role: string;
}

export interface PhysicalSourceSummary {
    id: number;
    label: string;
    source_type: string;
}

export interface CaseTimelineEntry {
    label: string;
    at: string;
    detail: string | null;
}

export interface CaseIntegritySummary {
    baseline_established: number;
    verified: number;
    verification_required: number;
    integrity_failure: number;
}

export interface CaseCustodyHolding {
    evidence_number: string;
    title: string;
    custodian: string | null;
    location: string | null;
    chain_verified: boolean;
}

export interface CaseCustodyEvent {
    id: number;
    evidence_number: string;
    evidence_title: string;
    from_custodian: string | null;
    to_custodian: string;
    performed_by: string;
    purpose: string;
    from_location: string | null;
    to_location: string | null;
    method: string;
    occurred_at: string;
}

export interface CaseCustody {
    holdings: CaseCustodyHolding[];
    history: CaseCustodyEvent[];
}

export interface CaseReport {
    report_number: string;
    title: string;
    generated_by: string;
    generated_at: string;
    status: string;
    content_verified: boolean | null;
    downloads_count: number;
}

export interface CaseFinding {
    finding_number: string;
    sequence_number: number;
    title: string;
    narrative: string;
    authored_by: string;
    evidence: { evidence_number: string; title: string } | null;
    attachment: { original_filename: string | null; size_bytes: number | null } | null;
    occurred_at: string;
}

export interface CaseFindings {
    items: CaseFinding[];
    chain_verified: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}
