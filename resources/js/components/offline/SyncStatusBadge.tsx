import type { OfflineSyncStatus } from "@/types/offline";

const STYLES: Record<OfflineSyncStatus, string> = {
    PENDING_SYNC: "border-slate-300 bg-slate-100 text-slate-700",
    SYNCING: "border-blue-200 bg-blue-50 text-blue-800",
    SYNCED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SYNC_FAILED: "border-red-200 bg-red-50 text-red-700",
    REQUIRES_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
};

const LABELS: Record<OfflineSyncStatus, string> = {
    PENDING_SYNC: "Pending sync",
    SYNCING: "Syncing…",
    SYNCED: "Synced",
    SYNC_FAILED: "Sync failed",
    REQUIRES_REVIEW: "Requires review",
};

export function SyncStatusBadge({ status }: { status: OfflineSyncStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${STYLES[status]}`}
        >
            {LABELS[status]}
        </span>
    );
}
