import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import EvidenceVerificationComparisonController from "@/actions/App/Http/Controllers/EvidenceVerificationComparisonController";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PhysicalSourceSummary } from "@/types/case";
import type { Evidence } from "@/types/evidence";
import { Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface CaseEvidenceRegisterProps {
    evidence: Evidence[];
    physicalSources: PhysicalSourceSummary[];
    caseNumber: string;
    onOpenCustody: () => void;
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

function HashCell({ hash }: { hash: string }) {
    const [copied, setCopied] = useState(false);

    const copyHash = async () => {
        await navigator.clipboard.writeText(hash);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex min-w-[170px] items-center gap-2">
            <code className="font-mono text-[11px] text-slate-600" title={hash}>
                {hash.slice(0, 10)}…{hash.slice(-8)}
            </code>
            <button
                type="button"
                onClick={copyHash}
                aria-label="Copy SHA-256 baseline"
                className="text-slate-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
                <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[16px]"
                >
                    {copied ? "check" : "content_copy"}
                </span>
            </button>
        </div>
    );
}

export function CaseEvidenceRegister({
    evidence,
    physicalSources,
    caseNumber,
    onOpenCustody,
}: CaseEvidenceRegisterProps) {
    const columns: ColumnDef<Evidence, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence record",
            cell: ({ row }) => (
                <div>
                    <Link
                        href={EvidenceController.show(
                            row.original.evidence_number,
                        )}
                        className="font-mono text-xs font-bold text-blue-800 hover:underline"
                    >
                        {row.original.evidence_number}
                    </Link>
                    <p className="max-w-[240px] truncate pt-1 text-sm font-semibold text-slate-800">
                        {row.original.title}
                    </p>
                    <p className="max-w-[240px] truncate text-xs text-slate-500">
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
            id: "source",
            header: "Source",
            cell: ({ row }) => (
                <span className="text-xs text-slate-600">
                    {row.original.physical_source?.label ?? "Digital intake"}
                </span>
            ),
        },
        {
            id: "registered_by",
            header: "Registered by",
            cell: ({ row }) => (
                <div>
                    <p className="text-xs font-medium text-slate-700">
                        {row.original.registered_by?.name ?? "Not recorded"}
                    </p>
                    <p className="pt-0.5 text-[11px] text-slate-500">
                        {formatDate(row.original.registered_at)}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "sha256_baseline",
            header: "SHA-256 baseline",
            cell: ({ row }) => <HashCell hash={row.original.sha256_baseline} />,
        },
        {
            accessorKey: "integrity_status",
            header: "Integrity",
            cell: ({ row }) => (
                <StatusBadge status={row.original.integrity_status} />
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
                            Inspect
                        </Link>
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onOpenCustody}
                        title={`View custody history for ${row.original.evidence_number}`}
                        aria-label={`View custody history for ${row.original.evidence_number}`}
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                            history
                        </span>
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                        <Link
                            href={EvidenceVerificationComparisonController.index({
                                query: { evidence: row.original.evidence_number },
                            })}
                            title={`Verify ${row.original.evidence_number}`}
                            aria-label={`Verify ${row.original.evidence_number}`}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                                fact_check
                            </span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-5">
            <DataTable
                title="Associated evidence inventory"
                description={`${evidence.length} registered exhibit${evidence.length === 1 ? "" : "s"} in this case`}
                headerAction={
                    <Button size="sm" variant="outline" asChild>
                        <a href={EvidenceController.export({ query: { case: caseNumber } }).url}>
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                download
                            </span>
                            Export hash manifest
                        </a>
                    </Button>
                }
                columns={columns}
                data={evidence}
                searchText="Search evidence, source, or examiner…"
                searchAccessor={(item) =>
                    `${item.evidence_number} ${item.title} ${item.original_filename} ${item.evidence_type} ${item.physical_source?.label ?? ""} ${item.registered_by?.name ?? ""}`
                }
                getRowId={(item) => item.evidence_number}
                emptyMessage="No evidence is registered in this case."
            />

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                    <PanelHeader
                        title="Physical sources"
                        description="Source media associated with the evidence inventory"
                    />
                    <div className="flex flex-col divide-y divide-slate-100 px-5">
                        {physicalSources.map((source) => (
                            <div
                                key={source.id}
                                className="flex items-center justify-between gap-4 py-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100">
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined text-[18px] text-slate-600"
                                        >
                                            hard_drive
                                        </span>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {source.label}
                                        </p>
                                        <p className="text-xs capitalize text-slate-500">
                                            {source.source_type.replace(
                                                /_/g,
                                                " ",
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Recorded
                                </span>
                            </div>
                        ))}

                        {physicalSources.length === 0 ? (
                            <p className="py-6 text-sm text-slate-500">
                                No physical sources recorded.
                            </p>
                        ) : null}
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Physical custody"
                        description="Storage and locker assignment"
                        action={
                            <Button size="sm" variant="outline" onClick={onOpenCustody}>
                                Manage custody
                            </Button>
                        }
                    />
                    <div className="flex gap-3 p-5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-700">
                            <span
                                aria-hidden="true"
                                className="material-symbols-outlined text-[20px]"
                            >
                                lock_clock
                            </span>
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                Custody records available
                            </p>
                            <p className="pt-1 text-xs leading-5 text-slate-500">
                                Review current custodians, pending transfers,
                                and completed custody activity for this case.
                            </p>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
