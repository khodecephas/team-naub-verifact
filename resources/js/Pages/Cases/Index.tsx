import CaseController from '@/actions/App/Http/Controllers/CaseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface CaseRow {
    id: number;
    case_number: string;
    title: string;
    status: string;
    case_manager: string | null;
    evidence_count: number;
    updated_at: string;
}

interface PaginatedCases {
    data: CaseRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface IndexProps {
    cases: PaginatedCases;
    filters: { status: string | null; search: string | null };
    statusCounts: { OPEN: number; IN_PROGRESS: number; CLOSED: number; ARCHIVED: number };
    stats: { total_cases: number; evidence_total: number; physical_source_total: number; archived_total: number };
    canCreate: boolean;
}

const STATUS_TABS: { label: string; value: string | null }[] = [
    { label: 'All Cases', value: null },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Archived', value: 'ARCHIVED' },
];

function statusVariant(status: string): 'default' | 'muted' {
    return status === 'CLOSED' || status === 'ARCHIVED' ? 'muted' : 'default';
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Case listing, adapted from a Stitch design. What changed and why:
 *
 * - The 4 KPI cards' underlying numbers are real, but "Fast-Track /
 *   Priority" was dropped — there's no queryable priority column (Cases
 *   Create folds a priority choice into free-text notes, not a structured
 *   field), so it was replaced with a real "Physical Sources" count
 *   instead of showing a number with nothing behind it.
 * - "100% Cryptographically Verified" and "Immutable WORM Vault Active"
 *   are gone — nothing has been verified yet (Phase 6 isn't built) and
 *   there's no WORM storage; the evidence card just shows the real count.
 * - Status filter tabs use the app's real CaseStatus values (Open, In
 *   Progress, Closed, Archived) instead of the source's invented
 *   legal-workflow labels ("Active Discovery", "Trial Prep") that don't
 *   correspond to anything in the schema.
 * - Priority/Matter Category/Jurisdiction filter dropdowns are gone along
 *   with the Docket/Jurisdiction and Discovery Deadline table columns —
 *   all of that is folded into unstructured case notes and can't be
 *   reliably filtered or displayed as if it were structured data.
 * - Bulk selection and its two actions ("Re-Verify Integrity Hashes",
 *   "Export Court Briefs") are dropped — no verification or reporting
 *   system exists to back them.
 * - Grid/Timeline view toggles are dropped — only List view has a real
 *   implementation; a toggle to two views that don't exist would be its
 *   own broken affordance.
 * - The list itself is now properly scoped server-side to cases the
 *   current user is actually allowed to see (CaseFile::scopeVisibleTo),
 *   matching CaseFilePolicy::view() — the source's mockup had no such
 *   concept since it wasn't wired to real authorization at all.
 */
export default function Index({ cases, filters, statusCounts, stats, canCreate }: IndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<{ status: string | null; search: string | null }>) => {
        router.get(
            CaseController.index().url,
            {
                status: next.status !== undefined ? next.status : filters.status,
                search: next.search !== undefined ? next.search : filters.search,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search: search || null });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cases" />

            <div className="mx-auto px-6 py-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Investigative Cases
                            </h1>
                            <p className="max-w-2xl text-sm text-slate-500">
                                Cases you created, manage, or are assigned to.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {canCreate ? (
                                <Button asChild>
                                    <Link href={CaseController.create()}>
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        New Case
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled title="Your role can't open new cases">
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    New Case
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Visible Cases
                            </span>
                            <span className="text-3xl font-bold text-slate-900">{stats.total_cases}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Registered Evidence
                            </span>
                            <span className="text-3xl font-bold text-slate-900">{stats.evidence_total}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Physical Sources
                            </span>
                            <span className="text-3xl font-bold text-slate-900">{stats.physical_source_total}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Archived
                            </span>
                            <span className="text-3xl font-bold text-slate-900">{stats.archived_total}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
                        <form onSubmit={submitSearch} className="relative max-w-xl">
                            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                                search
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by case title or case number…"
                                className="h-10 w-full rounded-lg border border-border bg-slate-50 pl-10 pr-4 text-sm text-slate-900 shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-ring/30"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.label}
                                    type="button"
                                    onClick={() => applyFilters({ status: tab.value })}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filters.status === tab.value
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                                            filters.status === tab.value ? 'bg-white/20' : 'bg-slate-200'
                                        }`}
                                    >
                                        {tab.value === null
                                            ? stats.total_cases
                                            : statusCounts[tab.value as keyof typeof statusCounts]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Case</TableHead>
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Evidence</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cases.data.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Link
                                                href={CaseController.show(c.case_number)}
                                                className="font-mono text-xs font-semibold text-secondary hover:underline"
                                            >
                                                {c.case_number}
                                            </Link>
                                            <div className="max-w-[280px] truncate text-sm font-medium text-slate-900" title={c.title}>
                                                {c.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {c.case_manager ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                        {initials(c.case_manager)}
                                                    </span>
                                                    <span className="text-sm text-slate-700">{c.case_manager}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{c.evidence_count} items</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant(c.status)}>{c.status.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {new Date(c.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={CaseController.show(c.case_number)}
                                                className="text-xs font-medium text-secondary hover:underline"
                                            >
                                                Open
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cases.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                                            No cases match these filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {cases.meta.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                                <span>
                                    Page {cases.meta.current_page} of {cases.meta.last_page} · {cases.meta.total} total
                                </span>
                                <div className="flex items-center gap-1">
                                    {cases.links.map((link, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                            className={`rounded px-2.5 py-1 ${
                                                link.active
                                                    ? 'bg-slate-900 text-white'
                                                    : link.url
                                                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                      : 'cursor-not-allowed text-slate-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
