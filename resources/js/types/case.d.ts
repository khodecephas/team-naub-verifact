export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';

export interface CaseSummary {
    id: number;
    case_number: string;
    title: string;
    status: CaseStatus;
    case_manager: string | null;
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
    name: string;
    system_role: string;
    case_role: string;
    assigned_at: string | null;
    assigned_by: string | null;
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

export interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}
