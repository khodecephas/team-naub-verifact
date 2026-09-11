import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { IssueWorkingCopyDialog } from "@/components/evidence/IssueWorkingCopyDialog";
import { RevokeWorkingCopyDialog } from "@/components/evidence/RevokeWorkingCopyDialog";
import { WorkingCopyDetails } from "@/components/evidence/WorkingCopyDetails";
import { WorkingCopyStatusBadge } from "@/components/evidence/WorkingCopyStatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type {
    Evidence,
    EvidenceDerivative,
    EvidencePersonSummary,
} from "@/types/evidence";
import type { ColumnDef } from "@tanstack/react-table";

interface EvidenceWorkingCopiesProps {
    evidence: Evidence;
    derivatives: EvidenceDerivative[];
    recipients: EvidencePersonSummary[];
    retention: { default: number; options: number[] };
    canIssue: boolean;
    dialogOpen: boolean;
    onDialogOpenChange: (open: boolean) => void;
}

function formatDateTime(value: string | null): string {
    if (!value) return "Not recorded";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function shortHash(hash: string): string {
    return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
}

export function EvidenceWorkingCopies({
    evidence,
    derivatives,
    recipients,
    retention,
    canIssue,
    dialogOpen,
    onDialogOpenChange,
}: EvidenceWorkingCopiesProps) {
    const columns: ColumnDef<EvidenceDerivative, unknown>[] = [
        {
            accessorKey: "derivative_number",
            header: "Copy ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-blue-800">
                    {row.original.derivative_number}
                </span>
            ),
        },
        {
            accessorKey: "issued_to",
            header: "Issued to",
            cell: ({ row }) => row.original.issued_to ?? "Not assigned",
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => (
                <span
                    className="block max-w-52 truncate"
                    title={row.original.purpose ?? undefined}
                >
                    {row.original.purpose ?? "Not recorded"}
                </span>
            ),
        },
        {
            accessorKey: "sha256",
            header: "SHA-256",
            cell: ({ row }) => (
                <button
                    type="button"
                    title={`${row.original.sha256} — click to copy`}
                    onClick={() =>
                        navigator.clipboard.writeText(row.original.sha256)
                    }
                    className="font-mono text-xs text-slate-600 hover:text-blue-700"
                >
                    {shortHash(row.original.sha256)}
                </button>
            ),
        },
        {
            accessorKey: "issued_at",
            header: "Issued",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs">
                    {formatDateTime(row.original.issued_at)}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <WorkingCopyStatusBadge status={row.original.status} />
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <WorkingCopyDetails
                        evidence={evidence}
                        derivative={row.original}
                    />
                    {row.original.can_revoke ? (
                        <RevokeWorkingCopyDialog
                            evidence={evidence}
                            derivative={row.original}
                        />
                    ) : null}
                    {row.original.can_download ? (
                        <Button size="sm" variant="outline" asChild>
                            <a
                                href={
                                    EvidenceController.downloadDerivative({
                                        evidence: evidence.evidence_number,
                                        derivative:
                                            row.original.derivative_number,
                                    }).url
                                }
                            >
                                Download
                            </a>
                        </Button>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-3">
            <DataTable
                title="Controlled working copies"
                description="Purpose-bound derivatives issued from the protected master"
                headerAction={
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDialogOpenChange(true)}
                        disabled={!canIssue}
                    >
                        <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[16px]"
                        >
                            content_copy
                        </span>
                        Issue working copy
                    </Button>
                }
                columns={columns}
                data={derivatives}
                searchText="Search copy, recipient, purpose, or status…"
                searchAccessor={(derivative) =>
                    `${derivative.derivative_number} ${derivative.issued_to ?? ""} ${derivative.purpose ?? ""} ${derivative.status}`
                }
                getRowId={(derivative) => derivative.derivative_number}
                emptyMessage="No controlled derivatives have been issued."
            />

            <div className="rounded-md border border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">
                SHA-256 protects each derivative file. The chained event hashes
                protect its recorded issuance history.
            </div>

            <IssueWorkingCopyDialog
                evidence={evidence}
                recipients={recipients}
                retention={retention}
                open={dialogOpen}
                onOpenChange={onDialogOpenChange}
            />
        </div>
    );
}
