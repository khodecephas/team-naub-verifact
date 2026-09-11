import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";

interface DashboardStats {
    active_cases: number;
    total_cases: number;
    evidence_total: number;
    physical_source_total: number;
    integrity: {
        baseline_established: number;
        verified: number;
        verification_required: number;
        integrity_failure: number;
    };
}

interface RecentCase {
    id: number;
    case_number: string;
    title: string;
    case_manager: string | null;
    status: string;
    evidence_count: number;
    updated_at: string;
}

interface RecentEvidenceItem {
    id: number;
    evidence_number: string;
    title: string;
    registered_by: string | null;
    registered_at: string;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

export default function Dashboard({
    auth,
    stats,
    recentCases,
    recentEvidence,
}: PageProps<{
    stats: DashboardStats;
    recentCases: RecentCase[];
    recentEvidence: RecentEvidenceItem[];
}>) {
    const metrics = [
        {
            label: "Active cases",
            value: stats.active_cases,
            detail: `${stats.total_cases} total case records`,
            icon: "folder_open",
            tone: "text-blue-700 bg-blue-50",
        },
        {
            label: "Registered evidence",
            value: stats.evidence_total,
            detail: `${stats.physical_source_total} physical sources`,
            icon: "inventory_2",
            tone: "text-slate-700 bg-slate-100",
        },
        {
            label: "Pending verification",
            value: stats.integrity.verification_required,
            detail: "Requires examiner action",
            icon: "schedule",
            tone: "text-amber-700 bg-amber-50",
        },
        {
            label: "Integrity alerts",
            value: stats.integrity.integrity_failure,
            detail: stats.integrity.integrity_failure
                ? "Immediate review required"
                : "No active failures",
            icon: "warning",
            tone: stats.integrity.integrity_failure
                ? "text-red-700 bg-red-50"
                : "text-emerald-700 bg-emerald-50",
        },
    ];
    const recentCaseColumns: ColumnDef<RecentCase, unknown>[] = [
        {
            accessorKey: "case_number",
            header: "Case ID / title",
            cell: ({ row }) => (
                <div>
                    <Link
                        href={CaseController.show(row.original.case_number)}
                        className="font-mono text-xs font-bold text-blue-800 hover:underline"
                    >
                        {row.original.case_number}
                    </Link>
                    <p className="mt-1 max-w-[280px] truncate text-xs font-medium text-slate-700">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "case_manager",
            header: "Lead / manager",
            cell: ({ row }) => (
                <span className="text-xs text-slate-600">
                    {row.original.case_manager ?? "Unassigned"}
                </span>
            ),
        },
        {
            accessorKey: "evidence_count",
            header: "Evidence",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600">
                    {row.original.evidence_count}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: "updated_at",
            header: "Last activity",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {formatDate(row.original.updated_at)}
                </span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            Dashboard{" "}
                            <span className="mx-1 text-slate-300">/</span>{" "}
                            Operational overview
                        </>
                    }
                    title={`Welcome, ${auth.user.name}`}
                    description="Review active investigations, registered evidence, and items requiring attention."
                    actions={
                        <>
                            <Button
                                variant="outline"
                                disabled
                                title="Verification is not implemented yet"
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    verified_user
                                </span>
                                Verify hash
                            </Button>
                            <Button
                                variant="outline"
                                disabled
                                title="Open a case first to register evidence"
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    add_box
                                </span>
                                Register evidence
                            </Button>
                            <Button asChild>
                                <Link href={CaseController.create()}>
                                    <span className="material-symbols-outlined text-[17px]">
                                        create_new_folder
                                    </span>
                                    Create case
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <Panel key={metric.label} className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                                    {metric.label}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className={`material-symbols-outlined rounded p-2 text-xl ${metric.tone}`}
                                >
                                    {metric.icon}
                                </span>
                            </div>
                            <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-950">
                                {metric.value.toLocaleString()}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                {metric.detail}
                            </p>
                        </Panel>
                    ))}
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
                    <div className="flex min-w-0 flex-col gap-6">
                        <DataTable
                            title="Recent cases"
                            description="Most recently updated investigation records"
                            headerAction={
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={CaseController.index()}>
                                        View all cases
                                    </Link>
                                </Button>
                            }
                            columns={recentCaseColumns}
                            data={recentCases}
                            searchText="Search recent cases…"
                            searchAccessor={(caseFile) =>
                                `${caseFile.case_number} ${caseFile.title} ${caseFile.case_manager ?? ""} ${caseFile.status}`
                            }
                            getRowId={(caseFile) => caseFile.case_number}
                            emptyMessage="No cases have been created."
                        />

                        <Panel>
                            <PanelHeader
                                title="Recent evidence activity"
                                description="Latest evidence registration events"
                                action={
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={EvidenceController.index()}>
                                            Evidence registry
                                        </Link>
                                    </Button>
                                }
                            />
                            <div className="divide-y divide-slate-100">
                                {recentEvidence.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 px-5 py-4"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined rounded bg-slate-100 p-2 text-lg text-slate-600"
                                        >
                                            description
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={EvidenceController.show(
                                                    item.evidence_number,
                                                )}
                                                className="block truncate text-sm font-semibold text-slate-800 hover:text-blue-800"
                                            >
                                                {item.title}
                                            </Link>
                                            <p className="mt-1 text-xs text-slate-500">
                                                <span className="font-mono font-medium">
                                                    {item.evidence_number}
                                                </span>{" "}
                                                · Registered by{" "}
                                                {item.registered_by ??
                                                    "unknown user"}
                                            </p>
                                        </div>
                                        <time
                                            dateTime={item.registered_at}
                                            className="shrink-0 text-xs text-slate-500"
                                        >
                                            {formatDate(item.registered_at)}
                                        </time>
                                    </div>
                                ))}
                                {recentEvidence.length === 0 && (
                                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                                        No evidence has been registered.
                                    </p>
                                )}
                            </div>
                        </Panel>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Panel>
                            <PanelHeader
                                title="Integrity status"
                                description="Current evidence integrity classifications"
                            />
                            <div className="space-y-3 p-5">
                                {[
                                    [
                                        "Baseline established",
                                        stats.integrity.baseline_established,
                                        "bg-blue-600",
                                    ],
                                    [
                                        "Verified",
                                        stats.integrity.verified,
                                        "bg-emerald-600",
                                    ],
                                    [
                                        "Verification required",
                                        stats.integrity.verification_required,
                                        "bg-amber-500",
                                    ],
                                    [
                                        "Integrity failure",
                                        stats.integrity.integrity_failure,
                                        "bg-red-600",
                                    ],
                                ].map(([label, value, color]) => (
                                    <div
                                        key={String(label)}
                                        className="flex items-center gap-2 text-xs"
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${color}`}
                                        />
                                        <span className="text-slate-600">
                                            {label}
                                        </span>
                                        <span className="ml-auto font-mono font-bold text-slate-900">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                                <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                                    A baseline records the file fingerprint at
                                    registration. It does not by itself indicate
                                    a later verification.
                                </p>
                            </div>
                        </Panel>
                        <Panel>
                            <PanelHeader
                                title="Pending custody actions"
                                description="Transfers and acknowledgements awaiting action"
                            />
                            <div className="p-5">
                                <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-2xl text-slate-400"
                                    >
                                        swap_horiz
                                    </span>
                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                        Custody workflow pending implementation
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Transfer requests and acknowledgements
                                        will appear here.
                                    </p>
                                    <Button
                                        className="mt-4"
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        title="Custody workflow is not available yet"
                                    >
                                        Open custody queue
                                    </Button>
                                </div>
                            </div>
                        </Panel>
                        <Panel>
                            <PanelHeader
                                title="Quick evidence ingestion"
                                description="Register evidence from the relevant case record"
                            />
                            <div className="p-5">
                                <button
                                    type="button"
                                    disabled
                                    title="Dashboard file ingestion is not available yet"
                                    className="flex w-full cursor-not-allowed flex-col items-center rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-400"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-3xl"
                                    >
                                        cloud_upload
                                    </span>
                                    <span className="mt-2 text-sm font-semibold text-slate-500">
                                        Drop evidence files here or browse
                                    </span>
                                    <span className="mt-1 text-xs">
                                        Documents, photos, audio, video, and
                                        forensic images
                                    </span>
                                </button>
                                <Button
                                    className="mt-4 w-full"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href={EvidenceController.index()}>
                                        <span className="material-symbols-outlined text-[16px]">
                                            inventory_2
                                        </span>
                                        View all evidence
                                    </Link>
                                </Button>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
