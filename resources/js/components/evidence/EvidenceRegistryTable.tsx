import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import EvidenceVerificationComparisonController from "@/actions/App/Http/Controllers/EvidenceVerificationComparisonController";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Evidence, PaginatedEvidence } from "@/types/evidence";
import { Link, router } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import type { ReactNode } from "react";

interface EvidenceRegistryTableProps {
    evidence: PaginatedEvidence;
    hasSearch: boolean;
    filterPanel?: ReactNode;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / 1024 ** unitIndex;

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function PersonCell({ name }: { name?: string }) {
    if (!name) {
        return <span className="text-xs text-slate-400">Not assigned</span>;
    }

    const initials = name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex min-w-[140px] items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {initials}
            </span>
            <span className="truncate text-xs font-medium text-slate-700">
                {name}
            </span>
        </div>
    );
}

export function EvidenceRegistryTable({
    evidence,
    hasSearch,
    filterPanel,
}: EvidenceRegistryTableProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [view, setView] = useState<"table" | "grid" | "timeline">("table");
    const visibleIds = evidence.data.map((item) => item.id);
    const allVisibleSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => selectedIds.includes(id));

    const toggleEvidence = (id: number) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((selectedId) => selectedId !== id)
                : [...current, id],
        );
    };

    const toggleAllVisible = () => {
        setSelectedIds((current) => {
            const recordsFromOtherPages = current.filter(
                (id) => !visibleIds.includes(id),
            );

            return allVisibleSelected
                ? recordsFromOtherPages
                : [...recordsFromOtherPages, ...visibleIds];
        });
    };

    const columns: ColumnDef<Evidence, unknown>[] = [
        {
            id: "select",
            header: () => (
                <input
                    type="checkbox"
                    aria-label="Select all visible evidence"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    aria-label={`Select evidence ${row.original.evidence_number}`}
                    checked={selectedIds.includes(row.original.id)}
                    onChange={() => toggleEvidence(row.original.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
                />
            ),
        },
        {
            accessorKey: "evidence_number",
            header: "Evidence record",
            cell: ({ row }) => (
                <div className="min-w-[230px]">
                    <div className="flex items-center gap-2">
                        <Link
                            href={EvidenceController.show(
                                row.original.evidence_number,
                            )}
                            className="font-mono text-xs font-bold text-blue-800 hover:underline"
                        >
                            {row.original.evidence_number}
                        </Link>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            {row.original.file_extension ?? "FILE"}
                        </span>
                    </div>
                    <p className="max-w-[260px] truncate pt-1 text-sm font-semibold text-slate-900">
                        {row.original.title}
                    </p>
                    <p
                        className="max-w-[260px] truncate text-xs text-slate-500"
                        title={row.original.original_filename}
                    >
                        {row.original.original_filename} ·{" "}
                        {formatBytes(row.original.file_size_bytes)}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "evidence_type",
            header: "Classification",
            cell: ({ row }) => (
                <span className="text-xs font-medium capitalize text-slate-700">
                    {row.original.evidence_type.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            id: "case",
            header: "Case assignment",
            cell: ({ row }) =>
                row.original.case ? (
                    <div className="min-w-[150px]">
                        <Link
                            href={CaseController.show(
                                row.original.case.case_number,
                            )}
                            className="font-mono text-xs font-bold text-blue-800 hover:underline"
                        >
                            {row.original.case.case_number}
                        </Link>
                        <p className="max-w-[180px] truncate pt-0.5 text-xs text-slate-500">
                            {row.original.case.title}
                        </p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">Unassigned</span>
                ),
        },
        {
            id: "source",
            header: "Source media",
            cell: ({ row }) => (
                <span className="text-xs text-slate-600">
                    {row.original.physical_source?.label ?? "Digital intake"}
                </span>
            ),
        },
        {
            id: "custodian",
            header: "Current custodian",
            cell: ({ row }) => (
                <PersonCell
                    name={
                        row.original.current_custodian?.name ??
                        row.original.registered_by?.name
                    }
                />
            ),
        },
        {
            accessorKey: "integrity_status",
            header: "Integrity",
            cell: ({ row }) => (
                <StatusBadge status={row.original.integrity_status} />
            ),
        },
        {
            accessorKey: "registered_at",
            header: "Registered",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {formatDate(row.original.registered_at)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" asChild>
                        <Link
                            href={EvidenceController.show(
                                row.original.evidence_number,
                            )}
                        >
                            Open
                        </Link>
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                        <Link
                            href={EvidenceVerificationComparisonController.index({
                                query: {
                                    evidence: row.original.evidence_number,
                                },
                            })}
                            title={`Compare ${row.original.evidence_number}`}
                            aria-label={`Compare ${row.original.evidence_number}`}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-lg">fact_check</span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            title="Master evidence register"
            description={`${evidence.meta.total} evidence record${evidence.meta.total === 1 ? "" : "s"} within your authorised scope`}
            headerAction={
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[16px]"
                    >
                        shield_lock
                    </span>
                    Authorised records only
                </div>
            }
            columns={columns}
            data={evidence.data}
            paginate={{ ...evidence.meta, links: evidence.links }}
            searchText="Search evidence ID, title, filename, or case…"
            emptyMessage={
                hasSearch
                    ? "No evidence matches this search."
                    : "No evidence has been registered."
            }
            displayMode={view}
            getRowId={(item) => item.evidence_number}
            renderGridItem={(item) => <EvidenceGridCard evidence={item} />}
            renderTimelineItem={(item) => <EvidenceTimelineRow evidence={item} />}
            filterTrigger={
                <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1">
                    {(["table", "grid", "timeline"] as const).map((mode) => (
                        <Button
                            key={mode}
                            size="icon"
                            variant={view === mode ? "secondary" : "ghost"}
                            aria-label={`${mode} view`}
                            title={`${mode} view`}
                            onClick={() => setView(mode)}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                {mode === "table" ? "view_list" : mode === "grid" ? "grid_view" : "view_timeline"}
                            </span>
                        </Button>
                    ))}
                </div>
            }
            filterPanel={filterPanel}
            bulkActions={
                selectedIds.length > 0 ? (
                    <div className="flex flex-col gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-blue-900">
                            {selectedIds.length} record
                            {selectedIds.length === 1 ? "" : "s"} selected
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        EvidenceController.verifyBatch().url,
                                        {
                                            evidence_numbers: evidence.data
                                                .filter((item) => selectedIds.includes(item.id))
                                                .map((item) => item.evidence_number),
                                        },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Verify integrity
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={EvidenceVerificationComparisonController.index({ query: { evidence: evidence.data.find((item) => item.id === selectedIds[0])?.evidence_number } })}>
                                    Compare first selected
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <a href={`${EvidenceController.export().url}?evidence_numbers=${encodeURIComponent(evidence.data.filter((item) => selectedIds.includes(item.id)).map((item) => item.evidence_number).join(","))}`}>
                                    Export manifest
                                </a>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                            >
                                Clear selection
                            </Button>
                        </div>
                    </div>
                ) : null
            }
        />
    );
}

function EvidenceGridCard({ evidence }: { evidence: Evidence }) {
    return (
        <Link href={EvidenceController.show(evidence.evidence_number)} className="block rounded-md border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
            <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-bold text-secondary">{evidence.evidence_number}</span>
                <StatusBadge status={evidence.integrity_status} />
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">{evidence.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">{evidence.original_filename}</p>
            <p className="mt-3 text-xs text-slate-500">{evidence.case?.case_number ?? "Unassigned"} · {formatBytes(evidence.file_size_bytes)}</p>
        </Link>
    );
}

function EvidenceTimelineRow({ evidence }: { evidence: Evidence }) {
    return (
        <Link href={EvidenceController.show(evidence.evidence_number)} className="flex items-start gap-4 py-4 hover:bg-slate-50">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-50" />
            <span className="min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-secondary">{evidence.evidence_number}</span>
                <span className="mt-1 block truncate text-sm font-semibold text-slate-900">{evidence.title}</span>
                <span className="mt-1 block text-xs text-slate-500">Registered {formatDate(evidence.registered_at)}</span>
            </span>
            <StatusBadge status={evidence.integrity_status} />
        </Link>
    );
}
