import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface VerificationRow {
    id: number;
    evidence_number: string | null;
    evidence_title: string | null;
    method: string;
    matches_baseline: boolean;
    verified_by: string;
    verified_at: string;
}
interface SyncAttemptRow {
    id: number;
    offline_collection_id: string;
    outcome: string;
    evidence_number: string | null;
    evidence_title: string | null;
    attempted_by: string;
    error_message: string | null;
    attempted_at: string;
}
interface ActivityEventRow {
    id: number;
    event_type: string;
    evidence_number: string | null;
    evidence_title: string | null;
    actor: string;
    occurred_at: string;
}
type Tab = "verifications" | "sync" | "activity";

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const EVENT_LABELS: Record<string, string> = {
    EVIDENCE_REGISTERED: "Evidence registered",
    OFFLINE_SYNC_COMPLETED: "Synchronized from offline device",
};

const METHOD_LABELS: Record<string, string> = {
    REGISTRATION_VALIDATION: "Registration validation",
    MASTER_REHASH: "Re-verification (auto or manual)",
    UPLOADED_COMPARISON: "Uploaded file comparison",
};

function EvidenceCell({ number, title }: { number: string | null; title: string | null }) {
    if (!number) {
        return <span className="text-xs text-slate-400">Not registered</span>;
    }

    return (
        <div className="min-w-[190px]">
            <Link href={EvidenceController.show(number)} className="font-mono text-xs font-bold text-secondary hover:underline">
                {number}
            </Link>
            {title ? <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{title}</p> : null}
        </div>
    );
}

export default function Index({
    verifications,
    syncAttempts,
    activityEvents,
    historyLimit,
}: {
    verifications: VerificationRow[];
    syncAttempts: SyncAttemptRow[];
    activityEvents: ActivityEventRow[];
    historyLimit: number;
}) {
    const [tab, setTab] = useState<Tab>("verifications");

    const tabs: { value: Tab; label: string; icon: string; count: number }[] = [
        { value: "verifications", label: "Verification checks", icon: "verified_user", count: verifications.length },
        { value: "sync", label: "Offline sync attempts", icon: "sync", count: syncAttempts.length },
        { value: "activity", label: "Activity log", icon: "history", count: activityEvents.length },
    ];
    const tabControls = (
        <div className="flex gap-1 overflow-x-auto rounded-md bg-slate-100 p-1">
            {tabs.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => setTab(item.value)}
                    className={`flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${tab === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <span
                        aria-hidden="true"
                        className={`material-symbols-outlined text-[17px] ${tab === item.value ? "text-secondary" : "text-slate-400"}`}
                    >
                        {item.icon}
                    </span>
                    {item.label}
                    <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${tab === item.value ? "bg-blue-50 text-blue-800" : "bg-slate-200 text-slate-500"}`}
                    >
                        {item.count}
                    </span>
                </button>
            ))}
        </div>
    );

    const verificationColumns: ColumnDef<VerificationRow, unknown>[] = [
        { id: "evidence", header: "Evidence", cell: ({ row }) => <EvidenceCell number={row.original.evidence_number} title={row.original.evidence_title} /> },
        {
            id: "method",
            header: "Check type",
            cell: ({ row }) => <span className="text-xs text-slate-600">{METHOD_LABELS[row.original.method] ?? row.original.method}</span>,
        },
        {
            id: "result",
            header: "Result",
            cell: ({ row }) => <StatusBadge status={row.original.matches_baseline ? "VERIFIED" : "INTEGRITY_FAILURE"} />,
        },
        { id: "performed_by", header: "Performed by", cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.verified_by}</span> },
        {
            id: "verified_at",
            header: "When",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs text-slate-500">{dateTime(row.original.verified_at)}</span>,
        },
    ];

    const syncColumns: ColumnDef<SyncAttemptRow, unknown>[] = [
        {
            id: "offline_id",
            header: "Offline ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600" title={row.original.offline_collection_id}>
                    OFFLINE-{row.original.offline_collection_id.slice(0, 8)}
                </span>
            ),
        },
        { id: "evidence", header: "Evidence", cell: ({ row }) => <EvidenceCell number={row.original.evidence_number} title={row.original.evidence_title} /> },
        { id: "outcome", header: "Outcome", cell: ({ row }) => <StatusBadge status={row.original.outcome} /> },
        { id: "attempted_by", header: "Attempted by", cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.attempted_by}</span> },
        {
            id: "error",
            header: "Detail",
            cell: ({ row }) => (
                <span className="block max-w-xs whitespace-normal text-xs text-slate-500">{row.original.error_message ?? "—"}</span>
            ),
        },
        {
            id: "attempted_at",
            header: "When",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs text-slate-500">{dateTime(row.original.attempted_at)}</span>,
        },
    ];

    const activityColumns: ColumnDef<ActivityEventRow, unknown>[] = [
        { id: "evidence", header: "Evidence", cell: ({ row }) => <EvidenceCell number={row.original.evidence_number} title={row.original.evidence_title} /> },
        {
            id: "event",
            header: "Event",
            cell: ({ row }) => <span className="text-xs font-semibold text-slate-700">{EVENT_LABELS[row.original.event_type] ?? row.original.event_type}</span>,
        },
        { id: "actor", header: "Recorded by", cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.actor}</span> },
        {
            id: "occurred_at",
            header: "When",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs text-slate-500">{dateTime(row.original.occurred_at)}</span>,
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Audit Log" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={<>Audit / System activity</>}
                    title="Audit log"
                    description={`Automated checks this system runs on its own — verification, offline sync, and the recorded activity ledger. Showing the most recent ${historyLimit} entries per category.`}
                />

                {tab === "verifications" && (
                    <DataTable
                        title="Verification checks"
                        description="Every hash comparison run against a registered master file — manual, automatic on open, or part of a case-wide sweep"
                        columns={verificationColumns}
                        data={verifications}
                        searchText="Search evidence, method, or performer…"
                        searchAccessor={(item) => `${item.evidence_number ?? ""} ${item.evidence_title ?? ""} ${item.method} ${item.verified_by}`}
                        filterTrigger={tabControls}
                        emptyMessage="No verification checks have been recorded yet."
                        getRowId={(item) => String(item.id)}
                    />
                )}
                {tab === "sync" && (
                    <DataTable
                        title="Offline sync attempts"
                        description="Includes attempts that failed before any evidence was registered — hash mismatches, authorization failures, and errors"
                        columns={syncColumns}
                        data={syncAttempts}
                        searchText="Search offline ID, evidence, or outcome…"
                        searchAccessor={(item) => `${item.offline_collection_id} ${item.evidence_number ?? ""} ${item.outcome} ${item.attempted_by}`}
                        filterTrigger={tabControls}
                        emptyMessage="No offline sync attempts have been recorded yet."
                        getRowId={(item) => String(item.id)}
                    />
                )}
                {tab === "activity" && (
                    <DataTable
                        title="Activity log"
                        description="The hash-chained evidence activity ledger (EvidenceActivityEventService)"
                        columns={activityColumns}
                        data={activityEvents}
                        searchText="Search evidence or event type…"
                        searchAccessor={(item) => `${item.evidence_number ?? ""} ${item.evidence_title ?? ""} ${item.event_type} ${item.actor}`}
                        filterTrigger={tabControls}
                        emptyMessage="No activity has been recorded yet."
                        getRowId={(item) => String(item.id)}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
