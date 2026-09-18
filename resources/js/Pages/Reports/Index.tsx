import ReportController from "@/actions/App/Http/Controllers/ReportController";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface ReportDownload {
    downloaded_at: string;
    downloaded_by: string;
    delivery_type: string;
}
interface ReportRow {
    report_number: string;
    title: string;
    case_number: string;
    case_title: string;
    generated_by: string;
    generated_at: string;
    status: string;
    content_verified: boolean | null;
    downloads_count: number;
    last_download: ReportDownload | null;
}
interface Props {
    reports: {
        data: ReportRow[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        case?: string;
        downloaded?: string;
    };
    caseOptions: { id: number; case_number: string; title: string }[];
    canCreate: boolean;
}
const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export default function Index({
    reports,
    filters,
    caseOptions,
    canCreate,
}: Props) {
    const [view, setView] = useState<"table" | "grid">("table");
    const hasFilters = Object.values(filters).some(Boolean);
    const setFilter = (
        key: "status" | "case" | "downloaded",
        value: string,
    ) => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );

        if (value) {
            params[key] = value;
        } else {
            delete params[key];
        }
        delete params.page;

        router.get(ReportController.index().url, params, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };
    const columns: ColumnDef<ReportRow, unknown>[] = [
        {
            accessorKey: "report_number",
            header: "Report",
            cell: ({ row }) => (
                <div className="min-w-[240px]">
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
            id: "case",
            header: "Case",
            cell: ({ row }) => (
                <div className="min-w-[180px]">
                    <p className="font-mono text-xs font-semibold">
                        {row.original.case_number}
                    </p>
                    <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {row.original.case_title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "generated_at",
            header: "Generated",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-700">
                        {dateTime(row.original.generated_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        by {row.original.generated_by}
                    </p>
                </div>
            ),
        },
        {
            id: "integrity",
            header: "Status & integrity",
            cell: ({ row }) => <ReportIntegrity report={row.original} />,
        },
        {
            id: "delivery",
            header: "Delivery history",
            cell: ({ row }) => <DeliveryHistory report={row.original} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="text-right">
                    <Button
                        size="sm"
                        variant={
                            row.original.content_verified === false
                                ? "destructive"
                                : "outline"
                        }
                        asChild
                    >
                        <Link
                            href={ReportController.show(
                                row.original.report_number,
                            )}
                        >
                            {row.original.content_verified === false
                                ? "Review change"
                                : "Open"}
                            <span className="material-symbols-outlined text-[15px]">
                                arrow_forward
                            </span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];
    return (
        <AuthenticatedLayout>
            <Head title="Reports" />
            <div className="flex flex-col gap-2">
                <PageHeader
                    eyebrow={
                        <>
                            Reports{" "}
                            <span className="mx-1 text-slate-300">/</span>{" "}
                            Document register
                        </>
                    }
                    title="Non-technical reports"
                    description="Plain-language evidence integrity and custody reports for judicial, disciplinary, and supervisory review."
                    actions={
                        canCreate ? (
                            <Button asChild>
                                <Link href={ReportController.create()}>
                                    <span className="material-symbols-outlined text-[17px]">
                                        note_add
                                    </span>
                                    Create report
                                </Link>
                            </Button>
                        ) : (
                            <Button disabled>Create report</Button>
                        )
                    }
                />
                <DataTable
                    title="Report register"
                    description={`${reports.total} report${reports.total === 1 ? "" : "s"} match the current view`}
                    columns={columns}
                    data={reports.data}
                    paginate={reports}
                    searchText="Search report, title, case, or author…"
                    emptyMessage="No reports match the current filters."
                    rowClassName={(report) =>
                        report.content_verified === false
                            ? "bg-red-50 ring-1 ring-inset ring-red-300 hover:bg-red-50"
                            : undefined
                    }
                    displayMode={view}
                    getRowId={(report) => report.report_number}
                    renderGridItem={(report) => (
                        <ReportGridCard report={report} />
                    )}
                    filterTrigger={
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                            <Button
                                size="sm"
                                variant={view === "table" ? "secondary" : "ghost"}
                                onClick={() => setView("table")}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    table_rows
                                </span>
                                List
                            </Button>
                            <Button
                                size="sm"
                                variant={view === "grid" ? "secondary" : "ghost"}
                                onClick={() => setView("grid")}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    grid_view
                                </span>
                                Grid
                            </Button>
                        </div>
                    }
                    filterPanel={
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <FilterSelect
                                label="Status"
                                value={filters.status}
                                onChange={(value) => setFilter("status", value)}
                                options={[
                                    ["", "All statuses"],
                                    ["DRAFT", "Draft"],
                                    ["FINAL", "Final"],
                                    ["SUPERSEDED", "Superseded"],
                                ]}
                            />
                            <FilterSelect
                                label="Case"
                                value={filters.case}
                                onChange={(value) => setFilter("case", value)}
                                options={[
                                    ["", "All cases"],
                                    ...caseOptions.map((item) => [
                                        item.case_number,
                                        `${item.case_number} — ${item.title}`,
                                    ]),
                                ]}
                            />
                            <FilterSelect
                                label="Delivery"
                                value={filters.downloaded}
                                onChange={(value) =>
                                    setFilter("downloaded", value)
                                }
                                options={[
                                    ["", "Any delivery state"],
                                    ["yes", "Downloaded / printed"],
                                    ["no", "Never downloaded"],
                                ]}
                            />
                            <div className="flex items-end">
                                {hasFilters && (
                                    <Button variant="ghost" asChild>
                                        <Link href={ReportController.index()}>
                                            <span className="material-symbols-outlined text-[17px]">
                                                filter_alt_off
                                            </span>
                                            Clear filters
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}

function ReportGridCard({ report }: { report: ReportRow }) {
    return (
        <Link
            href={ReportController.show(report.report_number)}
            className={`block rounded-md border p-4 transition-colors hover:border-blue-300 ${report.content_verified === false ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-blue-50/40"}`}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-bold text-secondary">
                    {report.report_number}
                </span>
                <ReportStatusBadge status={report.status} />
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">
                {report.title}
            </h3>
            <p className="mt-2 font-mono text-xs text-slate-500">
                {report.case_number}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{report.downloads_count} deliveries</span>
                <span>{dateTime(report.generated_at)}</span>
            </div>
        </Link>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: string[][];
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {label}
            <select
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 min-w-0 rounded-md border-slate-300 text-sm font-normal normal-case tracking-normal"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ReportIntegrity({ report }: { report: ReportRow }) {
    return (
        <div className="flex flex-col items-start gap-2">
            <ReportStatusBadge status={report.status} />
            {report.content_verified === false ? (
                <span className="inline-flex items-center gap-1 rounded bg-red-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="material-symbols-outlined text-[14px]">
                        gpp_bad
                    </span>
                    Content changed
                </span>
            ) : report.content_verified === true ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="material-symbols-outlined text-[15px]">
                        verified
                    </span>
                    Fingerprint matches
                </span>
            ) : null}
        </div>
    );
}

function DeliveryHistory({ report }: { report: ReportRow }) {
    if (!report.last_download)
        return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <span className="material-symbols-outlined text-[16px]">
                    cloud_off
                </span>
                Not downloaded
            </span>
        );

    return (
        <div>
            <p className="text-xs font-bold text-slate-800">
                {report.downloads_count} deliver
                {report.downloads_count === 1 ? "y" : "ies"}
            </p>
            <p className="mt-1 whitespace-nowrap text-[11px] text-slate-500">
                Last: {dateTime(report.last_download.downloaded_at)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
                {report.last_download.downloaded_by} ·{" "}
                {report.last_download.delivery_type === "PRINT"
                    ? "Print copy"
                    : "Download"}
            </p>
        </div>
    );
}
