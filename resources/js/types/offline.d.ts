export type OfflineSyncStatus =
    | "PENDING_SYNC"
    | "SYNCING"
    | "SYNCED"
    | "SYNC_FAILED"
    | "REQUIRES_REVIEW";

/**
 * One evidence item captured offline and held in IndexedDB until
 * synchronized. `localId` is the offline UUID used as the server's
 * idempotency key — it is never presented as an official evidence number.
 */
export interface OfflineEvidenceRecord {
    localId: string;
    ownerUserId: number;
    caseId: number;
    caseNumber: string;
    physicalSourceId: number | null;
    physicalSourceOfflineId: string | null;
    evidenceType: string;
    title: string;
    description: string | null;
    file: Blob;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    collectedAt: string;
    collectedTimezone: string;
    collectedBy: { id: number; name: string };
    localSha256: string;
    status: OfflineSyncStatus;
    syncError: string | null;
    serverSha256: string | null;
    evidenceNumber: string | null;
    synchronizedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** A physical source registered offline, pending sync ahead of its dependent evidence. */
export interface OfflinePhysicalSourceRecord {
    localId: string;
    ownerUserId: number;
    caseId: number;
    caseNumber: string;
    label: string;
    sourceType: string;
    description: string | null;
    collectionLocation: string | null;
    status: OfflineSyncStatus;
    syncError: string | null;
    realId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface OfflineCasePhysicalSource {
    id: number;
    label: string;
    source_type: string;
}

export interface OfflineCaseSummary {
    id: number;
    case_number: string;
    title: string;
    status: string;
    physical_sources: OfflineCasePhysicalSource[];
}

/** Minimal field-collection reference data cached for offline use. */
export interface OfflineBootstrapCache {
    ownerUserId: number;
    cases: OfflineCaseSummary[];
    evidenceTypes: string[];
    physicalSourceTypes: string[];
    maxUploadSizeKb: number;
    cachedAt: string;
}
