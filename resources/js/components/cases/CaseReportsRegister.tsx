import ReportController from "@/actions/App/Http/Controllers/ReportController";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { CaseReport } from "@/types/case";
import { Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";

interface CaseReportsRegisterProps {
    reports: CaseReport[];
    caseNumber: string;
    canCreateReport: boolean;
}

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

function ReportIntegrity({ report }: { report: CaseReport }) {
    return (
        <div className="flex flex-col items-start gap-2">
            <ReportStatusBadge status={report.status} />
            {report.content_verified === false ? (
                <span className="inline-flex items-center gap-1 rounded bg-red-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                        gpp_bad
                    </span>
                    Content changed
                </span>
            ) : report.content_verified === true ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                        verified
                    </span>
                    Fingerprint matches
                </span>
            ) : null}
        </div>
    );
}

export function CaseReportsRegister({ reports, caseNumber, canCreateReport }: CaseReportsRegisterProps) {
    const columns: ColumnDef<CaseReport, unknown>[] = [
        {
            accessorKey: "report_number",
            header: "Report",
            cell: ({ row }) => (
                <div className="min-w-[220px]">
                    <Link
                        href={ReportController.show(row.original.report_number)}
                        className={`font-mono text-xs font-bold hover:underline ${row.original.content_verified === false ? "text-red-800" : "text-secondary"}`}
                    >
                        {row.original.report_number}
                    </Link>
                    <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-800">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "generated_at",
            header: "Generated",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-700">{dateTime(row.original.generated_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">by {row.original.generated_by}</p>
                </div>
            ),
        },
        {
            id: "integrity",
            header: "Status & integrity",
            cell: ({ row }) => <ReportIntegrity report={row.original} />,
        },
        {
            accessorKey: "downloads_count",
            header: "Downloads",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600">{row.original.downloads_count}</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="text-right">
                    <Button
                        size="sm"
                        variant={row.original.content_verified === false ? "destructive" : "outline"}
                        asChild
                    >
                        <Link href={ReportController.show(row.original.report_number)}>
                            {row.original.content_verified === false ? "Review change" : "Open"}
                            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                                arrow_forward
                            </span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            title="Generated reports"
            description={`${reports.length} report${reports.length === 1 ? "" : "s"} generated from this case`}
            headerAction={
                canCreateReport ? (
                    <Button size="sm" asChild>
                        <Link href={`${ReportController.create().url}?case=${caseNumber}`}>
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                note_add
                            </span>
                            Create report
                        </Link>
                    </Button>
                ) : undefined
            }
            columns={columns}
            data={reports}
            searchText="Search report number, title, or author…"
            searchAccessor={(item) => `${item.report_number} ${item.title} ${item.generated_by}`}
            emptyMessage="No reports have been generated from this case."
            getRowId={(item) => item.report_number}
        />
    );
}
