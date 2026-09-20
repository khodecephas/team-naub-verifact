import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { checkEvidenceAssignments, checkSession, fetchBootstrap, SyncApiError, syncEvidenceRecord } from "@/offline/api";
import {
    deleteEvidenceRecord,
    getAllEvidenceRecords,
    getBootstrapCache,
    putBootstrapCache,
    putEvidenceRecord,
} from "@/offline/db";
import { sha256OfBlob } from "@/offline/hash";
import { useConnectivity } from "@/offline/useConnectivity";
import type { PageProps } from "@/types";
import type { OfflineBootstrapCache, OfflineEvidenceRecord } from "@/types/offline";
import { usePage } from "@inertiajs/react";
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
    description: string | null;
    file: File;
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
    pendingCount: number;
    syncing: boolean;
    refreshBootstrap: () => Promise<void>;
    refreshQueues: () => Promise<void>;
    saveEvidenceOffline: (input: NewOfflineEvidenceInput) => Promise<OfflineEvidenceRecord>;
    syncAll: () => Promise<SyncSummary>;
    retrySync: (localId: string) => Promise<void>;
    removeLocalDraft: (localId: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

function nowIso(): string {
    return new Date().toISOString();
}

/** A local-only display title derived from the filename — the server derives its own the same way. */
function titleFromFilename(filename: string): string {
    const withoutExtension = filename.replace(/\.[^./\\]+$/, "");

    return withoutExtension.trim() || filename;
}

/**
 * Mounted inside AuthenticatedLayout (never on guest pages), so `auth.user`
 * is always present here. `usePage()` needs a component that is itself a
 * descendant of Inertia's `<App>` — this provider qualifies because every
 * page renders `<AuthenticatedLayout>{...}</AuthenticatedLayout>`, and
 * this provider wraps that layout's children from inside it.
 */
export function OfflineProvider({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const userId = auth.user.id;

    const isOnline = useConnectivity();
    const [bootstrap, setBootstrap] = useState<OfflineBootstrapCache | null>(null);
    const [evidenceQueue, setEvidenceQueue] = useState<OfflineEvidenceRecord[]>([]);
    const [syncing, setSyncing] = useState(false);

    const refreshQueues = useCallback(async () => {
        const evidence = await getAllEvidenceRecords(userId);
        setEvidenceQueue(evidence.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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
        void refreshQueues();
    }, [refreshQueues]);

    useEffect(() => {
        void refreshBootstrap();
        // Only re-fetch bootstrap when connectivity is regained, not on
        // every render — avoids hammering the endpoint while online.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, userId]);

    /**
     * Refreshes whether already-synced evidence has since been assigned to
     * a case — the local queue never caches case assignment itself, only
     * this one boolean, so "Assign case" can disable itself once intake is
     * complete elsewhere. Best-effort: a failed check just leaves the
     * button enabled until the next successful one.
     */
    const checkAssignments = useCallback(async () => {
        if (!isOnline) {
            return;
        }

        const evidence = await getAllEvidenceRecords(userId);
        const unassigned = evidence.filter(
            (item) => item.status === "SYNCED" && item.evidenceNumber !== null && !item.caseAssigned,
        );

        if (unassigned.length === 0) {
            return;
        }

        try {
            const assignments = await checkEvidenceAssignments(
                unassigned.map((item) => item.evidenceNumber as string),
            );
            const newlyAssigned = unassigned.filter((item) => assignments[item.evidenceNumber as string]);

            if (newlyAssigned.length === 0) {
                return;
            }

            await Promise.all(
                newlyAssigned.map((item) =>
                    putEvidenceRecord({ ...item, caseAssigned: true, updatedAt: nowIso() }),
                ),
            );
            await refreshQueues();
        } catch {
            // Ignore — see doc comment above.
        }
    }, [isOnline, refreshQueues, userId]);

    useEffect(() => {
        void checkAssignments();
    }, [checkAssignments]);

    const saveEvidenceOffline = useCallback(
        async (input: NewOfflineEvidenceInput): Promise<OfflineEvidenceRecord> => {
            const localSha256 = await sha256OfBlob(input.file);
            const timestamp = nowIso();
            const record: OfflineEvidenceRecord = {
                localId: crypto.randomUUID(),
                ownerUserId: userId,
                title: titleFromFilename(input.file.name),
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
                caseAssigned: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await putEvidenceRecord(record);
            await refreshQueues();

            return record;
        },
        [auth.user.id, auth.user.name, refreshQueues, userId],
    );

    const removeLocalDraft = useCallback(
        async (localId: string) => {
            await deleteEvidenceRecord(localId);
            await refreshQueues();
        },
        [refreshQueues],
    );

    const syncOneEvidenceRecord = useCallback(
        async (record: OfflineEvidenceRecord): Promise<"synced" | "review" | "failed"> => {
            if (record.file === null) {
                // Should be unreachable — the blob is only ever cleared once
                // a record is SYNCED, and SYNCED records are never re-synced.
                // Fail safely rather than sending a request with no file.
                await putEvidenceRecord({
                    ...record,
                    status: "SYNC_FAILED",
                    syncError: "The original file is no longer available on this device.",
                    updatedAt: nowIso(),
                });

                return "failed";
            }

            await putEvidenceRecord({ ...record, status: "SYNCING", updatedAt: nowIso() });

            try {
                const result = await syncEvidenceRecord({
                    offline_collection_id: record.localId,
                    description: record.description,
                    client_sha256: record.localSha256,
                    collected_at: record.collectedAt,
                    collected_timezone: record.collectedTimezone,
                    file: record.file,
                    filename: record.filename,
                });

                // The server has independently stored, hashed, compared,
                // and committed the authoritative record — only now is it
                // safe to free the on-device copy. Every other field
                // (hashes, evidence number, timestamps) is kept for
                // audit/UI; only the blob itself is discarded.
                await putEvidenceRecord({
                    ...record,
                    file: null,
                    status: "SYNCED",
                    syncError: null,
                    serverSha256: result.server_sha256,
                    evidenceNumber: result.evidence_number,
                    synchronizedAt: result.registered_at,
                    caseAssigned: false,
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

            const pendingEvidence = await getAllEvidenceRecords(userId);

            for (const record of pendingEvidence) {
                if (record.status === "SYNCED") {
                    continue;
                }

                const outcome = await syncOneEvidenceRecord(record);
                if (outcome === "synced") summary.synced++;
                if (outcome === "review") summary.requiresReview++;
                if (outcome === "failed") summary.failed++;
            }

            return summary;
        } finally {
            await refreshQueues();
            void checkAssignments();
            setSyncing(false);
        }
    }, [checkAssignments, isOnline, refreshQueues, syncOneEvidenceRecord, userId]);

    const retrySync = useCallback(
        async (localId: string) => {
            const record = evidenceQueue.find((item) => item.localId === localId);
            if (!record) {
                return;
            }

            setSyncing(true);
            try {
                await checkSession();
                await syncOneEvidenceRecord(record);
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
        [evidenceQueue, refreshQueues, syncOneEvidenceRecord],
    );

    const pendingCount = useMemo(
        () => evidenceQueue.filter((item) => item.status !== "SYNCED").length,
        [evidenceQueue],
    );

    const hasUnsyncedRecords = useMemo(
        () => evidenceQueue.some((item) => item.status === "PENDING_SYNC"),
        [evidenceQueue],
    );

    const { notify } = useNotificationDialog();

    /**
     * Automatic sync when connectivity is present: fires whenever there is
     * at least one record still awaiting its first attempt. Deliberately
     * does not include SYNC_FAILED/REQUIRES_REVIEW here — those need an
     * explicit Retry, or this would hammer the server retrying the same
     * hash mismatch or authorization failure forever.
     */
    useEffect(() => {
        if (!isOnline || !hasUnsyncedRecords || syncing) {
            return;
        }

        void syncAll().then((summary) => {
            if (summary.sessionExpired) {
                notify({
                    title: "Session expired",
                    message: "Reconnected, but your session is no longer valid. Log in again, then return here to sync.",
                    tone: "error",
                });

                return;
            }

            if (summary.synced + summary.requiresReview + summary.failed === 0) {
                return;
            }

            notify({
                title: "Automatic sync complete",
                message: `${summary.synced} synced, ${summary.requiresReview} require review, ${summary.failed} failed.`,
                tone: summary.failed > 0 || summary.requiresReview > 0 ? "warning" : "success",
            });
        });
        // Re-run only when connectivity or the pending set changes — not on
        // every `syncAll`/`notify` identity change, which would refire this
        // on unrelated renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, hasUnsyncedRecords]);

    const value = useMemo<OfflineContextValue>(
        () => ({
            isOnline,
            bootstrap,
            evidenceQueue,
            pendingCount,
            syncing,
            refreshBootstrap,
            refreshQueues,
            saveEvidenceOffline,
            syncAll,
            retrySync,
            removeLocalDraft,
        }),
        [
            isOnline,
            bootstrap,
            evidenceQueue,
            pendingCount,
            syncing,
            refreshBootstrap,
            refreshQueues,
            saveEvidenceOffline,
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
