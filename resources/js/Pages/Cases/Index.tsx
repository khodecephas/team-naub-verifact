import CaseController from "@/actions/App/Http/Controllers/CaseController";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { CaseSummary, PaginatedData } from "@/types/case";
import { Head, Link, router, usePage } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface IndexProps {
    cases: PaginatedData<CaseSummary>;
    filters: {
        status?: string;
        search?: string;
        priority?: string;
        category?: string;
        lead?: string;
        jurisdiction?: string;
    };
    filterOptions: {
        leads: { id: number; name: string }[];
        jurisdictions: string[];
    };
    statusCounts: {
        OPEN: number;
        IN_PROGRESS: number;
        CLOSED: number;
        ARCHIVED: number;
    };
    stats: {
        total_cases: number;
        evidence_total: number;
        physical_source_total: number;
        archived_total: number;
    };
    canCreate: boolean;
}

const STATUS_TABS: { label: string; value: string | null }[] = [
    { label: "All Cases", value: null },
    { label: "Open", value: "OPEN" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Closed", value: "CLOSED" },
    { label: "Archived", value: "ARCHIVED" },
];

const PRIORITIES = [
    "High Priority — Active Discovery Defense",
    "Urgent — Immediate Preservation Order",
    "Standard — Routine Investigative Intake",
    "Low — Archival Review & Analysis",
];

const MATTER_CATEGORIES = [
    "Intellectual Property & Data Theft",
    "Financial Fraud & AML",
    "Insider Threat / Intrusion",
    "Cyber Incident Response",
    "Subpoena Compliance",
    "Other Judicial Order",
];

function initials(name: string): string {
    return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

/**
 * Case listing, reworked against the literal Stitch source (not a
 * paraphrase of it) to match it exactly. What's kept adapted rather than
 * ported as-is:
 *
 * - "100% Cryptographically Verified" on the Ingested Evidence card
 *   asserted Phase 6 verification that doesn't exist; it's replaced with
 *   "100% Baseline Established", which IS true — every registered item
 *   gets a SHA-256 baseline computed synchronously on registration
 *   (EvidenceRegistrationService). Same icon, same honest structure.
 * - "Immutable WORM Vault Active" on Archived & Sealed asserted storage
 *   infrastructure that isn't implemented; it says so instead.
 * - "Fast-Track / Priority" is restored with a real, honestly-zero count
 *   — there's no structured priority column (Cases Create folds a
 *   priority choice into free-text notes), so no case can actually be
 *   counted as urgent; 0 is the correct real number, not an omission.
 * - "Total Active Cases" uses total minus archived (real) rather than
 *   the source's unscoped mock count.
 * - Status filter tabs and the table's Status column use the app's real
 *   CaseStatus values (Open, In Progress, Closed, Archived) instead of
 *   the source's invented legal-workflow labels ("Active Discovery",
 *   "Trial Prep") that don't correspond to anything in the schema. Each
 *   row's Evidence Vault count is real; the source's per-row "Verified" /
 *   "Ingesting" sub-labels are dropped for the same verification-claim
 *   reason as the KPI card.
 * - Priority/Matter Category/Lead Custodian/Jurisdiction filter selects,
 *   the bulk-select strip and its two actions, the per-row overflow
 *   menu, and the Grid/Timeline view toggle are all restored as
 *   visually-present-but-disabled — none of those fields or systems
 *   exist yet. "Reset Filters" is real (clears status + search).
 * - "Batch Compliance Audit" and "Export Index" stay disabled — no audit
 *   or export system exists. "New Case Record" is real.
 * - The list itself is properly scoped server-side to cases the current
 *   user is actually allowed to see (CaseFile::scopeVisibleTo), matching
 *   CaseFilePolicy::view() — the source's mockup had no such concept.
 * - The table renders through the shared DataTable component (TanStack
 *   Table + Laravel pagination) rather than the source's fake "4 of 28"
 *   footer — real pagination beats a fabricated one. Its search box owns
 *   the `search` query param directly against the URL; the status tabs
 *   here own `status` the same way, so the two filters compose without
 *   either needing to know about the other's state.
 */
export default function Index({
    cases,
    filters,
    statusCounts,
    stats,
    canCreate,
    filterOptions,
}: IndexProps) {
    const { url } = usePage();
    const currentQuery = url.includes("?") ? `?${url.split("?")[1]}` : "";
    const [selected, setSelected] = useState<number[]>([]);
    const [view, setView] = useState<"table" | "grid" | "timeline">("table");

    const toggleSelected = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const setStatus = (status: string | null) => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );

        if (status) {
            params.status = status;
        } else {
            delete params.status;
        }
        delete params.page;

        router.get(CaseController.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const setFilter = (key: string, value: string) => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );
        if (value) params[key] = value;
        else delete params[key];
        delete params.page;
        router.get(CaseController.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        router.get(
            CaseController.index().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const activeCases = stats.total_cases - stats.archived_total;

    const columns: ColumnDef<CaseSummary, unknown>[] = [
        {
            id: "select",
            header: () => (
                <input
                    type="checkbox"
                    aria-label="Select all visible cases"
                    checked={
                        selected.length > 0 &&
                        selected.length === cases.data.length
                    }
                    onChange={() =>
                        setSelected(
                            selected.length === cases.data.length
                                ? []
                                : cases.data.map((c) => c.id),
                        )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    aria-label={`Select case ${row.original.case_number}`}
                    checked={selected.includes(row.original.id)}
                    onChange={() => toggleSelected(row.original.id)}
                    className="h-4 w-4 rounded border-slate-300"
                />
            ),
        },
        {
            accessorKey: "case_number",
            header: "Case ID & Operation Matter",
            cell: ({ row }) => (
                <>
                    <div className="flex items-center gap-2">
                        <Link
                            href={CaseController.show(row.original.case_number)}
                            className="font-mono text-xs font-semibold text-secondary hover:underline"
                        >
                            {row.original.case_number}
                        </Link>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            {row.original.priority ?? "Not classified"}
                        </span>
                    </div>
                    <div
                        className="max-w-[280px] truncate text-sm font-medium text-slate-900"
                        title={row.original.title}
                    >
                        {row.original.title}
                    </div>
                </>
            ),
        },
        {
            id: "case_manager",
            header: "Lead Custodian",
            cell: ({ row }) =>
                row.original.case_manager ? (
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {initials(row.original.case_manager)}
                        </span>
                        <span className="text-sm text-slate-700">
                            {row.original.case_manager}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                ),
        },
        {
            accessorKey: "evidence_count",
            header: "Evidence Vault",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.evidence_count} items
                </Badge>
            ),
        },
        {
            id: "docket",
            header: "Docket / Jurisdiction",
            cell: ({ row }) => (
                <div className="max-w-[190px] text-xs">
                    <p className="truncate font-mono text-slate-700">
                        {row.original.docket_reference ?? "—"}
                    </p>
                    <p className="mt-1 truncate text-slate-500">
                        {row.original.judicial_authority ?? "Not specified"}
                    </p>
                </div>
            ),
        },
        {
            id: "deadline",
            header: "Discovery Deadline",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-600">
                    {row.original.discovery_deadline ?? "Not specified"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Link
                        href={CaseController.show(row.original.case_number)}
                        className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            lock_open
                        </span>
                        Vault
                    </Link>
                    <Link
                        href={CaseController.show(row.original.case_number, {
                            query: { tab: "custody" },
                        })}
                        title="Open custody records"
                        aria-label={`Open custody records for ${row.original.case_number}`}
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-secondary"
                    >
                        <span className="material-symbols-outlined text-[16px]">link</span>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Cases" />

            <div>
                <div className="flex flex-col gap-2">
                    <PageHeader
                        eyebrow={
                            <>
                                Cases{" "}
                                <span className="mx-1 text-slate-300">/</span>{" "}
                                Investigation register
                            </>
                        }
                        title="Investigative cases"
                        description="Manage investigations, assigned personnel, evidence records, and case status."
                        actions={
                            <>
                                <Button variant="outline" asChild>
                                    <a href={`${CaseController.export().url}${currentQuery}`}>
                                        <span className="material-symbols-outlined text-[18px]">
                                            file_download
                                        </span>
                                        Export index
                                    </a>
                                </Button>
                                {canCreate ? (
                                    <Button asChild>
                                        <Link href={CaseController.create()}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                add_circle
                                            </span>
                                            Create case
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        disabled
                                        title="Your role can't open new cases"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            add_circle
                                        </span>
                                        Create case
                                    </Button>
                                )}
                            </>
                        }
                    />

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Total Active Cases
                                    </span>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-2xl font-semibold text-slate-900">
                                            {activeCases}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">
                                            MATTERS
                                        </span>
                                    </div>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-secondary">
                                    <span className="material-symbols-outlined text-[22px]">
                                        gavel
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-xs text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-slate-300" />
                                No discovery deadlines tracked yet
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Ingested Evidence
                                    </span>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-2xl font-semibold text-slate-900">
                                            {stats.evidence_total}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">
                                            ITEMS
                                        </span>
                                    </div>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-secondary">
                                    <span className="material-symbols-outlined text-[22px]">
                                        fingerprint
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-xs font-medium text-emerald-600">
                                <span className="material-symbols-outlined text-[15px]">
                                    check_circle
                                </span>
                                100% Baseline Established
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Fast-Track / Priority
                                    </span>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-2xl font-semibold text-slate-900">
                                            0
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">
                                            URGENT
                                        </span>
                                    </div>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                    <span className="material-symbols-outlined text-[22px]">
                                        alarm
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-xs text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-slate-300" />
                                No priority data tracked yet
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Archived &amp; Sealed
                                    </span>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-2xl font-semibold text-slate-900">
                                            {stats.archived_total}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">
                                            RECORDS
                                        </span>
                                    </div>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                    <span className="material-symbols-outlined text-[22px]">
                                        inventory_2
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-xs text-slate-400">
                                <span className="material-symbols-outlined text-[15px]">
                                    shield
                                </span>
                                WORM storage: not active
                            </div>
                        </div>
                    </div>

                    <DataTable
                        title="Case register"
                        description={`${cases.meta.total} case record${cases.meta.total === 1 ? "" : "s"} within your authorised scope`}
                        columns={columns}
                        data={cases.data}
                        paginate={{ ...cases.meta, links: cases.links }}
                        searchText="Search by Case ID, Title, Docket #, Lead Custodian, or Matter Type…"
                        emptyMessage="No cases match these filters."
                        displayMode={view}
                        getRowId={(caseFile) => caseFile.case_number}
                        renderGridItem={(caseFile) => (
                            <CaseGridCard caseFile={caseFile} />
                        )}
                        renderTimelineItem={(caseFile) => (
                            <CaseTimelineRow caseFile={caseFile} />
                        )}
                        bulkActions={
                            selected.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-blue-50 px-4 py-2.5">
                                    <span className="text-xs font-semibold text-blue-900">
                                        {selected.length} case{selected.length === 1 ? "" : "s"} selected
                                    </span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={CaseController.show(cases.data.find((item) => item.id === selected[0])!.case_number)}>
                                                Open selected
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={`${CaseController.export().url}?case_numbers=${encodeURIComponent(cases.data.filter((item) => selected.includes(item.id)).map((item) => item.case_number).join(","))}`}>
                                                Export selected
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ) : null
                        }
                        filterTrigger={
                            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                                {(["table", "grid", "timeline"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setView(mode)}
                                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {mode === "table" ? "table_rows" : mode === "grid" ? "grid_view" : "timeline"}
                                        </span>
                                        {mode === "table" ? "List" : mode[0].toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>
                        }
                        filterPanel={
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {STATUS_TABS.map((tab) => (
                                        <button
                                            key={tab.label}
                                            type="button"
                                            onClick={() => setStatus(tab.value)}
                                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                                filters.status === tab.value
                                                    ? "bg-slate-900 text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                        >
                                            {tab.label}
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${filters.status === tab.value ? "bg-white/20" : "bg-slate-200"}`}
                                            >
                                                {tab.value === null
                                                    ? stats.total_cases
                                                    : statusCounts[
                                                          tab.value as keyof typeof statusCounts
                                                      ]}
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">
                                            filter_alt_off
                                        </span>
                                        Reset filters
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <CaseFilter label="Priority" value={filters.priority} onChange={(value) => setFilter("priority", value)} options={[["", "All priorities"], ...PRIORITIES.map((value) => [value, value])]} />
                                    <CaseFilter label="Matter category" value={filters.category} onChange={(value) => setFilter("category", value)} options={[["", "All categories"], ...MATTER_CATEGORIES.map((value) => [value, value])]} />
                                    <CaseFilter label="Lead custodian" value={filters.lead} onChange={(value) => setFilter("lead", value)} options={[["", "All investigators"], ...filterOptions.leads.map((item) => [String(item.id), item.name])]} />
                                    <CaseFilter label="Jurisdiction / venue" value={filters.jurisdiction} onChange={(value) => setFilter("jurisdiction", value)} options={[["", "All courts / venues"], ...filterOptions.jurisdictions.map((value) => [value, value])]} />
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function CaseFilter({ label, value, options, onChange }: { label: string; value?: string; options: string[][]; onChange: (value: string) => void }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-border bg-white px-3 text-xs text-slate-700 shadow-sm focus:outline-none">
                {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
            </select>
        </label>
    );
}

function CaseGridCard({ caseFile }: { caseFile: CaseSummary }) {
    return (
        <Link href={CaseController.show(caseFile.case_number)} className="block rounded-md border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
            <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-bold text-secondary">{caseFile.case_number}</span>
                <StatusBadge status={caseFile.status} />
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{caseFile.title}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div><dt>Manager</dt><dd className="mt-1 truncate font-medium text-slate-700">{caseFile.case_manager ?? "Unassigned"}</dd></div>
                <div><dt>Evidence</dt><dd className="mt-1 font-medium text-slate-700">{caseFile.evidence_count} items</dd></div>
            </dl>
        </Link>
    );
}

function CaseTimelineRow({ caseFile }: { caseFile: CaseSummary }) {
    return (
        <Link href={CaseController.show(caseFile.case_number)} className="flex gap-4 py-4 hover:bg-slate-50">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-50" />
            <span className="min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-secondary">{caseFile.case_number}</span>
                <span className="mt-1 block truncate text-sm font-semibold text-slate-900">{caseFile.title}</span>
                <span className="mt-1 block text-xs text-slate-500">Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(caseFile.updated_at))}</span>
            </span>
            <StatusBadge status={caseFile.status} />
        </Link>
    );
}
