import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CaseCustodyEvent, CaseCustodyHolding } from "@/types/case";
import { Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";

interface CaseCustodyRegisterProps {
    holdings: CaseCustodyHolding[];
    history: CaseCustodyEvent[];
}

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export function CaseCustodyRegister({ holdings, history }: CaseCustodyRegisterProps) {
    const holdingColumns: ColumnDef<CaseCustodyHolding, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[220px]">
                    <Link
                        href={EvidenceController.show(row.original.evidence_number)}
                        className="font-mono text-xs font-bold text-secondary hover:underline"
                    >
                        {row.original.evidence_number}
                    </Link>
                    <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-800">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "custodian",
            header: "Current custodian",
            cell: ({ row }) => (
                <span className="text-sm text-slate-700">
                    {row.original.custodian ?? "Not assigned"}
                </span>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ row }) => (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-slate-400">
                        location_on
                    </span>
                    {row.original.location ?? "Not recorded"}
                </span>
            ),
        },
        {
            accessorKey: "chain_verified",
            header: "Chain status",
            cell: ({ row }) => (
                <StatusBadge status={row.original.chain_verified ? "VERIFIED" : "INTEGRITY_FAILURE"} />
            ),
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="text-right">
                    <Link
                        href={EvidenceController.show(row.original.evidence_number)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                    >
                        Manage custody
                        <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                            arrow_forward
                        </span>
                    </Link>
                </div>
            ),
        },
    ];

    const historyColumns: ColumnDef<CaseCustodyEvent, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[190px]">
                    <Link
                        href={EvidenceController.show(row.original.evidence_number)}
                        className="font-mono text-xs font-bold text-secondary hover:underline"
                    >
                        {row.original.evidence_number}
                    </Link>
                    <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                        {row.original.evidence_title}
                    </p>
                </div>
            ),
        },
        {
            id: "handoff",
            header: "Handoff",
            cell: ({ row }) => (
                <div className="min-w-[240px]">
                    <p className="text-sm font-semibold text-slate-800">
                        {row.original.from_custodian ?? "Initial intake"}{" "}
                        <span className="mx-1 text-slate-300">→</span>{" "}
                        {row.original.to_custodian}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Recorded by {row.original.performed_by}</p>
                </div>
            ),
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => (
                <span className="block max-w-xs whitespace-normal text-sm text-slate-600">
                    {row.original.purpose}
                </span>
            ),
        },
        {
            id: "location",
            header: "Location",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {row.original.from_location ?? "Unrecorded"} → {row.original.to_location ?? "Unrecorded"}
                </span>
            ),
        },
        {
            accessorKey: "occurred_at",
            header: "Recorded",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">{dateTime(row.original.occurred_at)}</span>
            ),
        },
        {
            accessorKey: "method",
            header: "Method",
            cell: ({ row }) => (
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {row.original.method.replace(/_/g, " ")}
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-5">
            <DataTable
                title="Current custody"
                description="Authoritative responsibility and recorded storage location for this case's evidence"
                columns={holdingColumns}
                data={holdings}
                searchText="Search evidence, custodian, or location…"
                searchAccessor={(item) =>
                    `${item.evidence_number} ${item.title} ${item.custodian ?? ""} ${item.location ?? ""}`
                }
                emptyMessage="No evidence is registered in this case."
                getRowId={(item) => item.evidence_number}
            />

            <DataTable
                title="Custody history"
                description="Permanent, append-only record of every custody handoff in this case"
                headerAction={
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                            lock
                        </span>
                        Append-only record
                    </span>
                }
                columns={historyColumns}
                data={history}
                searchText="Search evidence, custodian, purpose, or location…"
                searchAccessor={(item) =>
                    `${item.evidence_number} ${item.evidence_title} ${item.from_custodian ?? ""} ${item.to_custodian} ${item.performed_by} ${item.purpose} ${item.from_location ?? ""} ${item.to_location ?? ""}`
                }
                emptyMessage="No custody transfers have been recorded for this case."
                getRowId={(item) => String(item.id)}
            />

            <p className="text-xs leading-5 text-slate-500">
                To request or transfer custody of a specific item, open its record from the tables above.
            </p>
        </div>
    );
}
