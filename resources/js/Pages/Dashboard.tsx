import CaseController from '@/actions/App/Http/Controllers/CaseController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

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

function statusVariant(status: string): 'default' | 'muted' {
    return status === 'CLOSED' || status === 'ARCHIVED' ? 'muted' : 'default';
}

function timeAgo(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
}

/**
 * Adapted from the Stitch dashboard design. Several elements in the source
 * have no backend yet and were changed rather than faked with placeholder
 * numbers: "Pending Custody Requests" (no custody/access-request system)
 * became a real "Physical Sources" count; the fabricated "99.9% integrity"
 * / "Vault Assurance Level" / active-alert card became a real breakdown of
 * `integrity_status` counts; the custody/verification activity stream
 * became a plain evidence-registration feed (the only real audit-trail-like
 * data that exists); "Cold Vault Lock: ENGAGED", the fake session ID, the
 * notification badge, and the online/synced indicator were dropped
 * entirely. "Verify Hash" and "Register Evidence" (needs a case picked
 * first) stay disabled — there's no verify flow, and no case list to pick
 * one from yet. "Create Case" now links to the real case-intake page.
 */
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
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="mx-auto px-6 py-8">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6 pb-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Good morning, {auth.user.name}
                            </h1>
                            <p className="text-sm text-slate-500">H1 Digital Evidence Management Overview</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" disabled title="Verification isn't implemented yet">
                                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                Verify Hash
                            </Button>
                            <Button variant="outline" disabled title="Open a case first — not available from the dashboard yet">
                                <span className="material-symbols-outlined text-[18px]">add_box</span>
                                Register Evidence
                            </Button>
                            <Button asChild>
                                <Link href={CaseController.create()}>
                                    <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                                    Create Case
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon="folder_special"
                            label="Active Cases"
                            value={stats.active_cases}
                            footer={`${stats.total_cases} total cases`}
                        />
                        <StatCard
                            icon="dataset"
                            label="Registered Evidence"
                            value={stats.evidence_total}
                            footer={`${stats.physical_source_total} physical sources logged`}
                        />
                        <StatCard
                            icon="inventory_2"
                            label="Physical Sources"
                            value={stats.physical_source_total}
                            footer="Exhibits logged across all cases"
                        />
                        <StatCard
                            icon="enhanced_encryption"
                            label="Evidence Integrity"
                            value={stats.integrity.baseline_established}
                            footer="Baseline established — verification not yet run"
                        />
                    </div>

                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                        <div className="flex flex-col gap-8 lg:col-span-2">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Recent Cases</h2>
                                        <p className="text-xs text-slate-500">Most recently updated cases</p>
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Case</TableHead>
                                            <TableHead>Manager</TableHead>
                                            <TableHead>Evidence</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentCases.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <Link
                                                        href={CaseController.show(c.case_number)}
                                                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                                                    >
                                                        {c.case_number}
                                                    </Link>
                                                    <div className="max-w-[220px] truncate text-sm font-medium text-slate-900" title={c.title}>
                                                        {c.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">{c.case_manager ?? '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{c.evidence_count} items</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant(c.status)}>{c.status.replace('_', ' ')}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500">{timeAgo(c.updated_at)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {recentCases.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                                                    No cases yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Recent Evidence Registrations</h2>
                                    <p className="text-xs text-slate-500">
                                        Newest master evidence records. Chain-of-custody and verification history
                                        aren't tracked yet, so this shows registration events only.
                                    </p>
                                </div>
                                <div className="flex flex-col divide-y divide-slate-100">
                                    {recentEvidence.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-semibold text-slate-900">{item.title}</span>
                                                    <Link
                                                        href={EvidenceController.show(item.evidence_number)}
                                                        className="font-mono text-xs text-secondary hover:underline"
                                                    >
                                                        {item.evidence_number}
                                                    </Link>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Registered by {item.registered_by ?? 'unknown user'}
                                                </p>
                                            </div>
                                            <span className="whitespace-nowrap text-xs text-slate-400">
                                                {timeAgo(item.registered_at)}
                                            </span>
                                        </div>
                                    ))}
                                    {recentEvidence.length === 0 && (
                                        <p className="py-6 text-center text-sm text-slate-500">No evidence registered yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-base font-semibold text-slate-900">Integrity Status Breakdown</h2>
                                <IntegrityRow label="Baseline Established" value={stats.integrity.baseline_established} icon="verified" />
                                <IntegrityRow label="Verified" value={stats.integrity.verified} icon="check_circle" />
                                <IntegrityRow label="Verification Required" value={stats.integrity.verification_required} icon="pending" />
                                <IntegrityRow
                                    label="Integrity Failure"
                                    value={stats.integrity.integrity_failure}
                                    icon="error"
                                    tone="text-red-600"
                                />
                                <p className="text-xs leading-relaxed text-slate-400">
                                    Verification isn't implemented yet — every registered item currently shows
                                    Baseline Established.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-base font-semibold text-slate-900">Evidence</h2>
                                <p className="text-sm text-slate-500">
                                    Evidence is registered per case. Browse existing evidence, or open a case to
                                    register a new item.
                                </p>
                                <Button asChild className="w-full">
                                    <Link href={EvidenceController.index()}>
                                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                        View All Evidence
                                    </Link>
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">verified</span>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        System Certifications
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="muted">CJIS Level 4</Badge>
                                    <Badge variant="muted">FIPS 140-3</Badge>
                                    <Badge variant="muted">ISO/IEC 27037</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon, label, value, footer }: { icon: string; label: string; value: number; footer: string }) {
    return (
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">{icon}</span>
            </div>
            <div className="my-3 text-3xl font-bold tracking-tight text-slate-900">{value.toLocaleString()}</div>
            <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">{footer}</div>
        </div>
    );
}

function IntegrityRow({
    label,
    value,
    icon,
    tone = 'text-slate-900',
}: {
    label: string;
    value: number;
    icon: string;
    tone?: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <span className={`material-symbols-outlined text-[20px] ${tone}`}>{icon}</span>
            <div className="flex flex-1 items-center justify-between">
                <span className="text-sm text-slate-700">{label}</span>
                <span className={`text-sm font-semibold ${tone}`}>{value}</span>
            </div>
        </div>
    );
}
