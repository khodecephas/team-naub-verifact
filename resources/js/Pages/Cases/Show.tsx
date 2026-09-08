import CaseController from '@/actions/App/Http/Controllers/CaseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Evidence } from '@/types/evidence';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface CaseDetail {
    id: number;
    case_number: string;
    title: string;
    description: string | null;
    status: string;
    opened_at: string | null;
    closed_at: string | null;
    creator: string | null;
    case_manager: string | null;
    closer: string | null;
}

interface Personnel {
    id: number;
    name: string;
    role: string;
}

interface PhysicalSourceRow {
    id: number;
    label: string;
    source_type: string;
}

interface TimelineEntry {
    label: string;
    at: string;
    detail: string | null;
}

interface ShowProps {
    case: CaseDetail;
    personnel: Personnel[];
    evidence: Evidence[];
    physicalSources: PhysicalSourceRow[];
    integrity: {
        baseline_established: number;
        verified: number;
        verification_required: number;
        integrity_failure: number;
    };
    timeline: TimelineEntry[];
    canArchive: boolean;
    canRegisterEvidence: boolean;
}

function statusVariant(status: string): 'default' | 'muted' {
    return status === 'CLOSED' || status === 'ARCHIVED' ? 'muted' : 'default';
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Case detail page, adapted from a Stitch design. What changed and why:
 *
 * - The evidence table, personnel list, and integrity counts are now real
 *   queries (Evidence, CaseAssignment, IntegrityStatus breakdown) — the
 *   source's rows (fake hashes, "Verified"/"WORM ACTIVE", badge numbers,
 *   "Key Authenticated") were invented for the mockup.
 * - The timeline only plots events we actually have timestamps for: case
 *   opened, each evidence registration, case closed. The source's later
 *   steps (working copies issued, findings logged, judicial review) come
 *   from systems that don't exist yet, so they aren't shown as pending
 *   either — inventing a queue for a feature with no backend would be its
 *   own kind of false claim.
 * - Only 2 of the source's 6 tabs are real (Overview, Evidence Items); the
 *   rest (Chain of Custody, Findings & Analysis, Activity Audit, Generated
 *   Reports) render disabled, matching how the top nav already treats
 *   pages with no controller.
 * - "Transfer Custody" and "Generate Court-Ready Report" stay disabled —
 *   no custody or reporting system exists yet. "Archive Case" is real: it
 *   reuses Phase 2's existing `close` policy ability and `ARCHIVED` enum
 *   value, gated server-side (`canArchive`) rather than just hidden.
 * - The fake "Priority: HIGH (TIER 1)" and "Incident Date" badges are
 *   dropped — there's no structured priority/incident-date column (the
 *   create-case page folds a priority choice into free-text notes, which
 *   isn't reliably machine-readable back out).
 */
export default function Show({
    case: caseFile,
    personnel,
    evidence,
    physicalSources,
    integrity,
    timeline,
    canArchive,
    canRegisterEvidence,
}: ShowProps) {
    const [tab, setTab] = useState<'overview' | 'evidence'>('overview');

    const archive = () => {
        if (!confirm(`Archive ${caseFile.case_number}? This closes the case.`)) {
            return;
        }

        router.post(CaseController.archive(caseFile.case_number).url);
    };

    return (
        <AuthenticatedLayout>
            <Head title={caseFile.case_number} />

            <div className="mx-auto px-6 py-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex flex-col gap-1">
                            <nav className="flex items-center gap-2 text-xs text-slate-500">
                                <Link href={DashboardController.index()} className="transition-colors hover:text-slate-900">
                                    Dashboard
                                </Link>
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-900">
                                    {caseFile.case_number}
                                </span>
                            </nav>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{caseFile.title}</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {canRegisterEvidence ? (
                                <Button asChild>
                                    <Link href={EvidenceController.create(caseFile.case_number)}>
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        Register Evidence
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled title="You don't have access to register evidence on this case">
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    Register Evidence
                                </Button>
                            )}
                            <Button variant="outline" disabled title="No custody system yet">
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                Transfer Custody
                            </Button>
                            <Button variant="outline" disabled title="No reporting system yet">
                                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                Generate Report
                            </Button>
                            {canArchive && (
                                <Button variant="destructive" onClick={archive}>
                                    <span className="material-symbols-outlined text-[18px]">archive</span>
                                    Archive Case
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
                        <Badge variant="outline" className="font-mono">
                            {caseFile.case_number}
                        </Badge>
                        <Badge variant={statusVariant(caseFile.status)}>{caseFile.status.replace('_', ' ')}</Badge>
                        {caseFile.case_manager && (
                            <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-sm text-slate-700">
                                <span className="material-symbols-outlined text-[15px] text-secondary">badge</span>
                                Lead: {caseFile.case_manager}
                            </span>
                        )}
                        {caseFile.opened_at && (
                            <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-sm text-slate-500">
                                <span className="material-symbols-outlined text-[15px]">event</span>
                                Opened {new Date(caseFile.opened_at).toLocaleDateString()}
                            </span>
                        )}
                        {caseFile.closed_at && (
                            <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-sm text-slate-500">
                                <span className="material-symbols-outlined text-[15px]">event_busy</span>
                                Closed {new Date(caseFile.closed_at).toLocaleDateString()}
                                {caseFile.closer && ` by ${caseFile.closer}`}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setTab('overview')}
                            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                tab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('evidence')}
                            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                tab === 'evidence' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Evidence Items <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs">{evidence.length}</span>
                        </button>
                        {['Chain of Custody', 'Findings & Analysis', 'Activity Audit', 'Generated Reports'].map((label) => (
                            <span
                                key={label}
                                title="Not available yet"
                                className="shrink-0 cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium text-slate-300"
                            >
                                {label}
                            </span>
                        ))}
                    </div>

                    {tab === 'overview' ? (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:col-span-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    <span className="material-symbols-outlined text-[16px] text-secondary">description</span>
                                    Case Brief
                                </h2>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                    {caseFile.description || 'No description recorded.'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:col-span-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        <span className="material-symbols-outlined text-[16px]">groups</span>
                                        Personnel
                                    </h2>
                                    <span className="text-xs text-slate-400">{personnel.length}</span>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    {personnel.map((person) => (
                                        <div key={`${person.id}-${person.role}`} className="flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                                                {initials(person.name)}
                                            </span>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-sm font-medium text-slate-900">{person.name}</span>
                                                <span className="text-[11px] text-slate-500">{person.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {personnel.length === 0 && <p className="text-sm text-slate-400">No one assigned yet.</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm lg:col-span-3">
                                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    <span className="material-symbols-outlined text-[16px] text-emerald-600">shield</span>
                                    Integrity Status
                                </h2>
                                <div className="text-3xl font-bold text-slate-900">{evidence.length}</div>
                                <p className="text-xs text-slate-500">evidence items registered</p>
                                <div className="flex flex-col gap-1.5 pt-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Baseline established</span>
                                        <span className="font-semibold text-slate-900">{integrity.baseline_established}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Verified</span>
                                        <span className="font-semibold text-slate-900">{integrity.verified}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Verification required</span>
                                        <span className="font-semibold text-slate-900">{integrity.verification_required}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-600">Integrity failure</span>
                                        <span className="font-semibold text-red-600">{integrity.integrity_failure}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:col-span-12">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case Timeline</h2>
                                <div className="flex flex-col gap-4">
                                    {timeline.map((entry, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                                            <div className="flex flex-1 flex-col gap-0.5 border-b border-slate-50 pb-3">
                                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{entry.label}</span>
                                                    <span className="font-mono text-xs text-slate-400">
                                                        {new Date(entry.at).toLocaleString()}
                                                    </span>
                                                </div>
                                                {entry.detail && <span className="text-xs text-slate-500">{entry.detail}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {timeline.length === 0 && <p className="text-sm text-slate-400">No activity recorded yet.</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <h2 className="text-base font-semibold text-slate-900">Evidence Inventory</h2>
                                    <span className="text-xs text-slate-400">{evidence.length} items</span>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Evidence #</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>SHA-256 Baseline</TableHead>
                                            <TableHead>Integrity</TableHead>
                                            <TableHead />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {evidence.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs font-semibold text-secondary">
                                                    {item.evidence_number}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-900">{item.title}</TableCell>
                                                <TableCell className="text-xs text-slate-500">{item.evidence_type}</TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(item.sha256_baseline)}
                                                        title="Copy full hash"
                                                        className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-100"
                                                    >
                                                        {item.sha256_baseline.slice(0, 8)}…{item.sha256_baseline.slice(-8)}
                                                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.integrity_status.replace(/_/g, ' ')}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={EvidenceController.show(item.evidence_number)}
                                                        className="text-xs font-medium text-secondary hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {evidence.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                                                    No evidence registered on this case yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {physicalSources.length > 0 && (
                                <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="text-base font-semibold text-slate-900">Physical Sources</h2>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        {physicalSources.map((source) => (
                                            <div key={source.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">hard_drive</span>
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-sm font-medium text-slate-900">{source.label}</span>
                                                    <span className="text-[11px] text-slate-500">{source.source_type.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
