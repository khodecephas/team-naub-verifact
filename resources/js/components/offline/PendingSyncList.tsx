import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { SyncStatusBadge } from "@/components/offline/SyncStatusBadge";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import { useOffline } from "@/offline/OfflineProvider";
import type { OfflineEvidenceRecord } from "@/types/offline";
import { Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

function HashStatus({ record }: { record: OfflineEvidenceRecord }) {
    if (record.status === "SYNCED" && record.serverSha256) {
        const matches = record.serverSha256 === record.localSha256;

        return (
            <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${matches ? "text-emerald-700" : "text-red-700"}`}
            >
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                    {matches ? "verified" : "gpp_bad"}
                </span>
                {matches ? "Client/server match" : "Mismatch"}
            </span>
        );
    }

    return (
        <span className="font-mono text-[11px] text-slate-500" title={record.localSha256}>
            Local: {record.localSha256.slice(0, 10)}…
        </span>
    );
}

export function PendingSyncList() {
    const { evidenceQueue, syncing, syncAll, retrySync, removeLocalDraft } = useOffline();
    const [viewing, setViewing] = useState<OfflineEvidenceRecord | null>(null);
    const { confirm, notify } = useNotificationDialog();

    const removeDraft = async (record: OfflineEvidenceRecord) => {
        const confirmed = await confirm({
            title: "Remove this local draft?",
            message:
                record.status === "SYNCED"
                    ? `This only removes the local copy on this device. ${record.evidenceNumber ?? "The evidence"} remains registered on the server.`
                    : `${record.title} has not been synchronized. Removing it deletes the only copy of this evidence and cannot be undone.`,
            confirmLabel: "Remove local draft",
            tone: record.status === "SYNCED" ? "warning" : "error",
        });

        if (confirmed) {
            await removeLocalDraft(record.localId);
        }
    };

    const runSyncAll = async () => {
        const summary = await syncAll();

        if (summary.sessionExpired) {
            notify({
                title: "Session expired",
                message: "Your Laravel session is no longer valid. Log in again, then return here to sync.",
                tone: "error",
            });

            return;
        }

        notify({
            title: "Sync complete",
            message: `${summary.synced} synced, ${summary.requiresReview} require review, ${summary.failed} failed.`,
            tone: summary.failed > 0 || summary.requiresReview > 0 ? "warning" : "success",
        });
    };

    const columns: ColumnDef<OfflineEvidenceRecord, unknown>[] = [
        {
            id: "offline_id",
            header: "Offline ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-secondary" title={row.original.localId}>
                    OFFLINE-{row.original.localId.slice(0, 8)}
                </span>
            ),
        },
        {
            id: "evidence",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[200px]">
                    <p className="text-sm font-semibold text-slate-800">{row.original.title}</p>
                    <p className="text-xs text-slate-500">{row.original.filename}</p>
                    {row.original.evidenceNumber ? (
                        <>
                            <p className="mt-1 font-mono text-[11px] font-bold text-emerald-700">
                                {row.original.evidenceNumber}
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {row.original.caseAssigned ? "Assigned to a case" : "Not yet assigned to a case"}
                            </p>
                        </>
                    ) : (
                        <p className="mt-1 text-[11px] text-slate-400">Not yet synchronized</p>
                    )}
                </div>
            ),
        },
        {
            id: "collected_at",
            header: "Collected At",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-600">{dateTime(row.original.collectedAt)}</span>
            ),
        },
        {
            id: "size",
            header: "File Size",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600">{formatBytes(row.original.sizeBytes)}</span>
            ),
        },
        {
            id: "hash",
            header: "Hash Status",
            cell: ({ row }) => <HashStatus record={row.original} />,
        },
        {
            id: "sync_status",
            header: "Sync Status",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <SyncStatusBadge status={row.original.status} />
                    {row.original.syncError ? (
                        <span className="max-w-[220px] text-[11px] text-red-600">{row.original.syncError}</span>
                    ) : null}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex flex-wrap justify-end gap-1.5">
                    {row.original.status === "SYNCED" && row.original.evidenceNumber ? (
                        row.original.caseAssigned ? (
                            <Button size="sm" disabled title="Already assigned to a case">
                                Case assigned
                            </Button>
                        ) : (
                            <Button size="sm" asChild>
                                <Link href={EvidenceController.show(row.original.evidenceNumber)}>Assign case</Link>
                            </Button>
                        )
                    ) : row.original.status !== "SYNCED" ? (
                        <Button size="sm" variant="outline" onClick={() => void retrySync(row.original.localId)}>
                            Retry
                        </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setViewing(row.original)}>
                        View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void removeDraft(row.original)}>
                        Remove
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <DataTable
                title="Pending sync"
                description="Evidence collected offline on this device"
                headerAction={
                    <Button size="sm" onClick={() => void runSyncAll()} disabled={syncing}>
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                            sync
                        </span>
                        {syncing ? "Syncing…" : "Sync Now"}
                    </Button>
                }
                columns={columns}
                data={evidenceQueue}
                searchText="Search offline evidence…"
                searchAccessor={(item) => `${item.localId} ${item.title} ${item.filename} ${item.evidenceNumber ?? ""}`}
                getRowId={(item) => item.localId}
                emptyMessage="No evidence has been collected offline on this device."
            />

            <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewing?.title}</DialogTitle>
                        <DialogDescription>Offline collection and synchronization details</DialogDescription>
                    </DialogHeader>
                    {viewing ? (
                        <div className="grid gap-4 p-5 text-sm">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Detail label="Offline ID" value={viewing.localId} mono />
                                <Detail label="Collected by" value={viewing.collectedBy.name} />
                                {viewing.evidenceNumber ? (
                                    <Detail label="Evidence number" value={viewing.evidenceNumber} mono />
                                ) : null}
                                {viewing.description ? (
                                    <Detail label="Field notes" value={viewing.description} />
                                ) : null}
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-semibold text-slate-700">
                                    Collected: {dateTime(viewing.collectedAt)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Client-recorded while offline ({viewing.collectedTimezone})
                                </p>
                                {viewing.synchronizedAt ? (
                                    <>
                                        <p className="mt-2 text-xs font-semibold text-slate-700">
                                            Synchronized: {dateTime(viewing.synchronizedAt)}
                                        </p>
                                        <p className="text-xs text-slate-500">Recorded by the H1 server</p>
                                    </>
                                ) : (
                                    <p className="mt-2 text-xs text-slate-500">Not yet synchronized</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Detail label="Local (client) SHA-256" value={viewing.localSha256} mono />
                                {viewing.serverSha256 ? (
                                    <Detail label="Server SHA-256" value={viewing.serverSha256} mono />
                                ) : null}
                            </div>
                            {viewing.syncError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    {viewing.syncError}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewing(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-0.5 break-all ${mono ? "font-mono text-xs" : "text-sm font-semibold text-slate-800"}`}>
                {value}
            </p>
        </div>
    );
}
