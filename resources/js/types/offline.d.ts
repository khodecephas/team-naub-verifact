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
 *
 * Deliberately has no case, physical source, or evidence type — this
 * mirrors Quick Ingest's "secure now, complete details later" path so an
 * officer under pressure never has to pick a case (or wait for one that
 * was created after this device last had connectivity) before securing a
 * file. `title` is a local-only display label derived from the filename;
 * the server derives its own from the uploaded file the same way.
 */
export interface OfflineEvidenceRecord {
    localId: string;
    ownerUserId: number;
    title: string;
    description: string | null;
    /**
     * Null once `status` is SYNCED — the blob is deleted right after the
     * server confirms it independently stored, hashed, and compared the
     * file and committed the authoritative evidence record, freeing device
     * storage. Every other field (hashes, evidence number, timestamps)
     * stays for audit/UI. Never cleared for PENDING_SYNC, SYNCING,
     * SYNC_FAILED, or REQUIRES_REVIEW — those still need the original file
     * to retry or to review a mismatch.
     */
    file: Blob | null;
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
    /** Refreshed against the server while online; only meaningful once `evidenceNumber` is set. */
    caseAssigned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface OfflineCaseSummary {
    id: number;
    case_number: string;
    title: string;
    status: string;
}

/** Minimal reference data cached for offline use — never a blocker for capturing evidence. */
export interface OfflineBootstrapCache {
    ownerUserId: number;
    user: { id: number; name: string; email: string; role: string };
    cases: OfflineCaseSummary[];
    evidenceTypes: string[];
    physicalSourceTypes: string[];
    maxUploadSizeKb: number;
    cachedAt: string;
}
