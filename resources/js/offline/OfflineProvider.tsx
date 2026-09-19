import {
    checkSession,
    fetchBootstrap,
    SyncApiError,
    syncEvidenceRecord,
    syncPhysicalSourceRecord,
} from "@/offline/api";
import {
    deleteEvidenceRecord,
    getAllEvidenceRecords,
    getAllPhysicalSourceRecords,
    getBootstrapCache,
    putBootstrapCache,
    putEvidenceRecord,
    putPhysicalSourceRecord,
} from "@/offline/db";
import { sha256OfBlob } from "@/offline/hash";
import type { PageProps, User } from "@/types";
import type {
    OfflineBootstrapCache,
    OfflineEvidenceRecord,
    OfflinePhysicalSourceRecord,
} from "@/types/offline";
import { router } from "@inertiajs/react";
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

interface NewOfflineEvidenceInput {
    caseId: number;
    caseNumber: string;
    physicalSourceId: number | null;
    physicalSourceOfflineId: string | null;
    evidenceType: string;
    title: string;
    description: string | null;
    file: File;
}

interface NewOfflinePhysicalSourceInput {
    caseId: number;
    caseNumber: string;
    label: string;
    sourceType: string;
    description: string | null;
    collectionLocation: string | null;
}

interface SyncSummary {
    synced: number;
    requiresReview: number;
    failed: number;
    sessionExpired: boolean;
}

interface OfflineContextValue {
    isOnline: boolean;
    bootstrap: OfflineBootstrapCache | null;
    evidenceQueue: OfflineEvidenceRecord[];
    physicalSourceQueue: OfflinePhysicalSourceRecord[];
    pendingCount: number;
    syncing: boolean;
    refreshBootstrap: () => Promise<void>;
    refreshQueues: () => Promise<void>;
    saveEvidenceOffline: (input: NewOfflineEvidenceInput) => Promise<OfflineEvidenceRecord>;
    savePhysicalSourceOffline: (input: NewOfflinePhysicalSourceInput) => Promise<OfflinePhysicalSourceRecord>;
    syncAll: () => Promise<SyncSummary>;
    retrySync: (localId: string) => Promise<void>;
    removeLocalDraft: (localId: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

function nowIso(): string {
    return new Date().toISOString();
}

export function OfflineProvider({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const userId = auth.user.id;

    const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
    const [bootstrap, setBootstrap] = useState<OfflineBootstrapCache | null>(null);
    const [evidenceQueue, setEvidenceQueue] = useState<OfflineEvidenceRecord[]>([]);
    const [physicalSourceQueue, setPhysicalSourceQueue] = useState<OfflinePhysicalSourceRecord[]>([]);
    const [syncing, setSyncing] = useState(false);

    const refreshQueues = useCallback(async () => {
        const [evidence, sources] = await Promise.all([
            getAllEvidenceRecords(userId),
            getAllPhysicalSourceRecords(userId),
        ]);
        setEvidenceQueue(evidence.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setPhysicalSourceQueue(sources);
    }, [userId]);

    const refreshBootstrap = useCallback(async () => {
        if (isOnline) {
            try {
                const fresh = await fetchBootstrap();
                const cache: OfflineBootstrapCache = { ...fresh, ownerUserId: userId };
                await putBootstrapCache(cache);
                setBootstrap(cache);

                return;
            } catch {
                // Fall through to whatever was cached — a failed refresh
                // (e.g. connectivity dropped mid-request) must not wipe out
                // reference data the field team still needs.
            }
        }

        const cached = await getBootstrapCache(userId);
        setBootstrap(cached ?? null);
    }, [isOnline, userId]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        void refreshQueues();
    }, [refreshQueues]);

    useEffect(() => {
        void refreshBootstrap();
        // Only re-fetch bootstrap when connectivity is regained, not on
        // every render — avoids hammering the endpoint while online.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, userId]);

    const saveEvidenceOffline = useCallback(
        async (input: NewOfflineEvidenceInput): Promise<OfflineEvidenceRecord> => {
            const localSha256 = await sha256OfBlob(input.file);
            const timestamp = nowIso();
            const record: OfflineEvidenceRecord = {
                localId: crypto.randomUUID(),
                ownerUserId: userId,
                caseId: input.caseId,
                caseNumber: input.caseNumber,
                physicalSourceId: input.physicalSourceId,
                physicalSourceOfflineId: input.physicalSourceOfflineId,
                evidenceType: input.evidenceType,
                title: input.title,
                description: input.description,
                file: input.file,
                filename: input.file.name,
                mimeType: input.file.type || "application/octet-stream",
                sizeBytes: input.file.size,
                collectedAt: timestamp,
                collectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                collectedBy: { id: auth.user.id, name: auth.user.name },
                localSha256,
                status: "PENDING_SYNC",
                syncError: null,
                serverSha256: null,
                evidenceNumber: null,
                synchronizedAt: null,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await putEvidenceRecord(record);
            await refreshQueues();

            return record;
        },
        [auth.user.id, auth.user.name, refreshQueues, userId],
    );

    const savePhysicalSourceOffline = useCallback(
        async (input: NewOfflinePhysicalSourceInput): Promise<OfflinePhysicalSourceRecord> => {
            const timestamp = nowIso();
            const record: OfflinePhysicalSourceRecord = {
                localId: crypto.randomUUID(),
                ownerUserId: userId,
                caseId: input.caseId,
                caseNumber: input.caseNumber,
                label: input.label,
                sourceType: input.sourceType,
                description: input.description,
                collectionLocation: input.collectionLocation,
                status: "PENDING_SYNC",
                syncError: null,
                realId: null,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await putPhysicalSourceRecord(record);
            await refreshQueues();

            return record;
        },
        [refreshQueues, userId],
    );

    const removeLocalDraft = useCallback(
        async (localId: string) => {
            await deleteEvidenceRecord(localId);
            await refreshQueues();
        },
        [refreshQueues],
    );

    const syncOnePhysicalSource = useCallback(async (record: OfflinePhysicalSourceRecord): Promise<number | null> => {
        try {
            const result = await syncPhysicalSourceRecord(record.caseNumber, {
                offline_collection_id: record.localId,
                label: record.label,
                source_type: record.sourceType,
                description: record.description,
                collection_location: record.collectionLocation,
            });

            await putPhysicalSourceRecord({
                ...record,
                status: "SYNCED",
                syncError: null,
                realId: result.id,
                updatedAt: nowIso(),
            });

            return result.id;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Physical source sync failed.";
            const requiresReview = error instanceof SyncApiError && error.status === 403;

            await putPhysicalSourceRecord({
                ...record,
                status: requiresReview ? "REQUIRES_REVIEW" : "SYNC_FAILED",
                syncError: message,
                updatedAt: nowIso(),
            });

            return null;
        }
    }, []);

    const syncOneEvidenceRecord = useCallback(
        async (record: OfflineEvidenceRecord, resolvedPhysicalSourceIds: Map<string, number>): Promise<"synced" | "review" | "failed"> => {
            let physicalSourceId = record.physicalSourceId;

            if (physicalSourceId === null && record.physicalSourceOfflineId) {
                physicalSourceId = resolvedPhysicalSourceIds.get(record.physicalSourceOfflineId) ?? null;

                if (physicalSourceId === null) {
                    await putEvidenceRecord({
                        ...record,
                        status: "SYNC_FAILED",
                        syncError: "Its physical source has not synced yet. Sync Now again once that succeeds.",
                        updatedAt: nowIso(),
                    });

                    return "failed";
                }
            }

            await putEvidenceRecord({ ...record, status: "SYNCING", updatedAt: nowIso() });

            try {
                const result = await syncEvidenceRecord(record.caseNumber, {
                    offline_collection_id: record.localId,
                    physical_source_id: physicalSourceId,
                    title: record.title,
                    description: record.description,
                    evidence_type: record.evidenceType,
                    client_sha256: record.localSha256,
                    collected_at: record.collectedAt,
                    collected_timezone: record.collectedTimezone,
                    file: record.file,
                    filename: record.filename,
                });

                await putEvidenceRecord({
                    ...record,
                    physicalSourceId,
                    status: "SYNCED",
                    syncError: null,
                    serverSha256: result.server_sha256,
                    evidenceNumber: result.evidence_number,
                    synchronizedAt: result.registered_at,
                    updatedAt: nowIso(),
                });

                return "synced";
            } catch (error) {
                const message = error instanceof Error ? error.message : "Evidence sync failed.";
                const requiresReview =
                    error instanceof SyncApiError && (error.status === 403 || error.status === 422);
                const serverSha256 =
                    error instanceof SyncApiError && typeof error.body === "object" && error.body !== null && "server_sha256" in error.body
                        ? String((error.body as { server_sha256: unknown }).server_sha256)
                        : record.serverSha256;

                await putEvidenceRecord({
                    ...record,
                    status: requiresReview ? "REQUIRES_REVIEW" : "SYNC_FAILED",
                    syncError: message,
                    serverSha256,
                    updatedAt: nowIso(),
                });

                return requiresReview ? "review" : "failed";
            }
        },
        [],
    );

    const syncAll = useCallback(async (): Promise<SyncSummary> => {
        const summary: SyncSummary = { synced: 0, requiresReview: 0, failed: 0, sessionExpired: false };

        if (!isOnline) {
            return summary;
        }

        setSyncing(true);

        try {
            try {
                await checkSession();
            } catch (error) {
                if (error instanceof SyncApiError && error.status === 401) {
                    summary.sessionExpired = true;

                    return summary;
                }

                throw error;
            }

            const [pendingSources, pendingEvidence] = await Promise.all([
                getAllPhysicalSourceRecords(userId),
                getAllEvidenceRecords(userId),
            ]);

            const resolvedPhysicalSourceIds = new Map<string, number>();
            for (const source of pendingSources) {
                if (source.realId !== null) {
                    resolvedPhysicalSourceIds.set(source.localId, source.realId);
                    continue;
                }
                if (source.status === "SYNCED") {
                    continue;
                }

                const realId = await syncOnePhysicalSource(source);
                if (realId !== null) {
                    resolvedPhysicalSourceIds.set(source.localId, realId);
                }
            }

            for (const record of pendingEvidence) {
                if (record.status === "SYNCED") {
                    continue;
                }

                const outcome = await syncOneEvidenceRecord(record, resolvedPhysicalSourceIds);
                if (outcome === "synced") summary.synced++;
                if (outcome === "review") summary.requiresReview++;
                if (outcome === "failed") summary.failed++;
            }

            return summary;
        } finally {
            await refreshQueues();
            setSyncing(false);
        }
    }, [isOnline, refreshQueues, syncOneEvidenceRecord, syncOnePhysicalSource, userId]);

    const retrySync = useCallback(
        async (localId: string) => {
            const record = evidenceQueue.find((item) => item.localId === localId);
            if (!record) {
                return;
            }

            setSyncing(true);
            try {
                await checkSession();
                const sources = await getAllPhysicalSourceRecords(userId);
                const resolved = new Map<string, number>();
                sources.forEach((source) => {
                    if (source.realId !== null) {
                        resolved.set(source.localId, source.realId);
                    }
                });
                await syncOneEvidenceRecord(record, resolved);
            } catch {
                await putEvidenceRecord({
                    ...record,
                    status: "SYNC_FAILED",
                    syncError: "Could not confirm your session is still active. Log in again and retry.",
                    updatedAt: nowIso(),
                });
            } finally {
                await refreshQueues();
                setSyncing(false);
            }
        },
        [evidenceQueue, refreshQueues, syncOneEvidenceRecord, userId],
    );

    const pendingCount = useMemo(
        () => evidenceQueue.filter((item) => item.status !== "SYNCED").length,
        [evidenceQueue],
    );

    const value = useMemo<OfflineContextValue>(
        () => ({
            isOnline,
            bootstrap,
            evidenceQueue,
            physicalSourceQueue,
            pendingCount,
            syncing,
            refreshBootstrap,
            refreshQueues,
            saveEvidenceOffline,
            savePhysicalSourceOffline,
            syncAll,
            retrySync,
            removeLocalDraft,
        }),
        [
            isOnline,
            bootstrap,
            evidenceQueue,
            physicalSourceQueue,
            pendingCount,
            syncing,
            refreshBootstrap,
            refreshQueues,
            saveEvidenceOffline,
            savePhysicalSourceOffline,
            syncAll,
            retrySync,
            removeLocalDraft,
        ],
    );

    return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
    const context = useContext(OfflineContext);

    if (!context) {
        throw new Error("useOffline must be used within an OfflineProvider");
    }

    return context;
}
