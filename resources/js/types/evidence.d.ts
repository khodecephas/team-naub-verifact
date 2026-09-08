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
    case?: EvidenceCaseSummary;
    physical_source?: EvidencePhysicalSourceSummary | null;
    registered_by?: EvidenceRegisteredBySummary;
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
