import { ReportSection } from "@/components/reports/ReportSection";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export interface ReportEvidence {
    evidence_number: string;
    title: string;
    type: string;
    registered_by: string | null;
    registered_at: string;
    physical_source: string | null;
    current_custodian: string | null;
    integrity_status: string;
    integrity_warning: boolean;
    custody_warning: boolean;
    chain_statement: string;
    verification: {
        last_verified_at: string | null;
        result: string;
        statement: string;
    };
    custody: {
        occurred_at: string;
        from: string | null;
        to: string | null;
        performed_by: string | null;
        purpose: string;
        from_location: string | null;
        to_location: string | null;
    }[];
    working_copies: {
        copy_id: string;
        issued_to: string | null;
        purpose: string | null;
        issued_at: string | null;
        status: string;
    }[];
}

const dateTime = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "Not recorded";

export function EvidenceReportSummary({
    evidence,
}: {
    evidence: ReportEvidence[];
}) {
    return (
        <ReportSection number={2} title="Evidence Summary">
            <div className="space-y-4">
                {evidence.map((item) => (
                    <article
                        key={item.evidence_number}
                        className="rounded border border-slate-200 p-4"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-mono text-xs font-bold text-slate-500">
                                    {item.evidence_number}
                                </p>
                                <h3 className="mt-1 font-semibold text-slate-950">
                                    {item.title}
                                </h3>
                            </div>
                            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                                {item.integrity_status.replace(/_/g, " ")}
                            </span>
                        </div>
                        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                            <Detail label="Type" value={item.type} />
                            <Detail
                                label="Registered by"
                                value={item.registered_by ?? "Not recorded"}
                            />
                            <Detail
                                label="Registered at"
                                value={dateTime(item.registered_at)}
                            />
                            <Detail
                                label="Physical source"
                                value={item.physical_source ?? "Digital intake"}
                            />
                            <Detail
                                label="Current custodian"
                                value={item.current_custodian ?? "Not assigned"}
                            />
                        </dl>
                    </article>
                ))}
            </div>
        </ReportSection>
    );
}

export function IntegrityExplanation({
    explanation,
    evidence,
}: {
    explanation: string;
    evidence: ReportEvidence[];
}) {
    return (
        <ReportSection number={3} title="Integrity Verification">
            <div className="rounded bg-slate-50 p-4">{explanation}</div>
            <div className="mt-4 space-y-3">
                {evidence.map((item) => (
                    <div
                        key={item.evidence_number}
                        className={`flex gap-3 rounded border p-4 ${item.integrity_warning ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    >
                        {item.integrity_warning ? (
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                        ) : (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        )}
                        <div>
                            <p className="font-semibold text-slate-950">
                                {item.evidence_number}
                            </p>
                            <p className="mt-1">
                                {item.verification.statement}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Last checked:{" "}
                                {dateTime(item.verification.last_verified_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ReportSection>
    );
}

export function CustodyReportTimeline({
    evidence,
}: {
    evidence: ReportEvidence[];
}) {
    return (
        <ReportSection number={4} title="Chain of Custody">
            <div className="space-y-6">
                {evidence.map((item) => (
                    <article key={item.evidence_number}>
                        <div className="flex items-center gap-2">
                            <ShieldCheck
                                className={`h-4 w-4 ${item.custody_warning ? "text-red-700" : "text-emerald-700"}`}
                            />
                            <h3 className="font-semibold text-slate-950">
                                {item.evidence_number}
                            </h3>
                        </div>
                        <p
                            className={`mt-1 text-xs font-semibold ${item.custody_warning ? "text-red-700" : "text-emerald-700"}`}
                        >
                            {item.chain_statement}
                        </p>
                        <ol className="mt-3 border-l border-slate-300 pl-5">
                            {item.custody.map((event) => (
                                <li
                                    key={`${item.evidence_number}-${event.occurred_at}-${event.to}`}
                                    className="relative pb-4 last:pb-0"
                                >
                                    <span className="absolute -left-[23px] top-2 h-1.5 w-1.5 rounded-full bg-slate-700" />
                                    <time className="text-xs font-semibold text-slate-500">
                                        {dateTime(event.occurred_at)}
                                    </time>
                                    <p className="mt-1">
                                        Responsibility{" "}
                                        {event.from
                                            ? `transferred from ${event.from} to`
                                            : "recorded with"}{" "}
                                        {event.to ?? "an unrecorded custodian"}{" "}
                                        for {event.purpose.toLowerCase()}.
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </article>
                ))}
            </div>
        </ReportSection>
    );
}

export function WorkingCopyReportSummary({
    explanation,
    evidence,
}: {
    explanation: string;
    evidence: ReportEvidence[];
}) {
    const copies = evidence.flatMap((item) =>
        item.working_copies.map((copy) => ({
            ...copy,
            evidence_number: item.evidence_number,
        })),
    );
    type WorkingCopy = (typeof copies)[number];
    const columns: ColumnDef<WorkingCopy, unknown>[] = [
        {
            accessorKey: "copy_id",
            header: "Copy",
            cell: ({ row }) => (
                <span className="font-mono font-semibold">
                    {row.original.copy_id}
                </span>
            ),
        },
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <span className="font-mono">
                    {row.original.evidence_number}
                </span>
            ),
        },
        {
            accessorKey: "issued_to",
            header: "Issued to",
            cell: ({ row }) => row.original.issued_to ?? "Not recorded",
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => row.original.purpose ?? "Not recorded",
        },
        {
            accessorKey: "issued_at",
            header: "Issued",
            cell: ({ row }) => dateTime(row.original.issued_at),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => row.original.status.replace(/_/g, " "),
        },
    ];

    return (
        <ReportSection number={5} title="Working Copy Accountability">
            <p>{explanation}</p>
            <div className="mt-4">
                <DataTable
                    columns={columns}
                    data={copies}
                    hideSearch
                    getRowId={(copy) => copy.copy_id}
                    emptyMessage="No working copies were recorded for the selected evidence."
                />
            </div>
        </ReportSection>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </dt>
            <dd className="mt-1 text-slate-800">{value}</dd>
        </div>
    );
}
