import CaseController from '@/actions/App/Http/Controllers/CaseController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes } from '@/lib/utils';
import { Evidence } from '@/types/evidence';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

function integrityVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
    if (status === 'VERIFIED') return 'success';
    if (status === 'VERIFICATION_REQUIRED') return 'warning';
    if (status === 'INTEGRITY_FAILURE') return 'destructive';
    return 'default';
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
            <span className="text-sm text-slate-900">{value}</span>
        </div>
    );
}

/**
 * Evidence detail page, adapted from a Stitch design. The source's
 * "File Integrity & Fingerprint" card had a real integrity problem, not
 * just a cosmetic one: it showed a "Current Verification Fingerprint"
 * identical to the baseline with a "MATCH CONFIRMED" label, a fabricated
 * MD5 hash we never compute, and a "Verify Integrity Now" button that
 * faked a success result client-side after a timeout. None of that is
 * real — Phase 6 (verification) isn't built, so nothing has actually been
 * re-checked against the baseline yet. Showing a fake match would directly
 * contradict the baseline-established model this app is built around. This
 * page shows only the real, once-computed `sha256_baseline` and the real
 * `integrity_status`.
 *
 * Also dropped: the fake "Primary Custodian / Locker #04 / Working Copies
 * Active" custody card (no custody or working-copy system exists), the
 * 6-node lifecycle timeline (5 of its 6 steps — custody transfer, working
 * copy issuance, re-verification, court report — are systems that don't
 * exist; only "Registered" is real), badge numbers on the registering
 * user, and "View File" / "Request Working Copy" / "Transfer Custody"
 * (no download, working-copy, or custody system yet — Phase 3's spec
 * explicitly left evidence download for a later phase).
 */
export default function Show({ evidence }: { evidence: Evidence }) {
    return (
        <AuthenticatedLayout>
            <Head title={`${evidence.evidence_number} — ${evidence.title}`} />

            <div className="mx-auto px-6 py-8">
                <div className="flex flex-col gap-6">
                    <nav className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href={EvidenceController.index()} className="transition-colors hover:text-slate-900">
                            Evidence Repository
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="font-mono">{evidence.evidence_number}</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-slate-900">{evidence.title}</span>
                    </nav>

                    <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-sm lg:flex-row lg:items-center">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500">
                                <span className="material-symbols-outlined text-[22px]">description</span>
                            </span>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    {evidence.evidence_number}: {evidence.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{evidence.evidence_type}</Badge>
                                    <Badge variant={integrityVariant(evidence.integrity_status)}>
                                        {evidence.integrity_status.replace(/_/g, ' ')}
                                    </Badge>
                                    <Badge variant="muted">
                                        <span className="material-symbols-outlined text-[14px]">lock</span>
                                        Original Master
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" disabled title="Evidence download isn't available yet">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                View File
                            </Button>
                            <Button variant="outline" disabled title="No working-copy system yet">
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                Request Working Copy
                            </Button>
                            <Button variant="outline" disabled title="Verification isn't implemented yet">
                                <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                                Verify Integrity
                            </Button>
                            <Button variant="outline" disabled title="No custody system yet">
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                Transfer Custody
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:col-span-5">
                            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
                                Evidence Metadata
                            </h2>
                            <MetaField label="Original Filename" value={evidence.original_filename} />
                            <MetaField label="MIME Type" value={evidence.mime_type ?? 'Unknown'} />
                            <MetaField label="File Size" value={formatBytes(evidence.file_size_bytes)} />
                            <MetaField
                                label="Registered At"
                                value={new Date(evidence.registered_at).toLocaleString()}
                            />
                            <MetaField label="Registered By" value={evidence.registered_by?.name ?? '—'} />
                            {evidence.description && <MetaField label="Notes" value={<span className="whitespace-pre-line">{evidence.description}</span>} />}

                            {evidence.case && (
                                <div className="mt-2 flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Associated Case</span>
                                    <Link
                                        href={CaseController.show(evidence.case.case_number)}
                                        className="flex items-center justify-between text-sm font-medium text-secondary hover:underline"
                                    >
                                        <span>
                                            {evidence.case.case_number} — {evidence.case.title}
                                        </span>
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </Link>
                                </div>
                            )}

                            {evidence.physical_source && (
                                <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Physical Source</span>
                                    <span className="flex items-center gap-1.5 text-sm text-slate-900">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">hard_drive</span>
                                        {evidence.physical_source.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:col-span-7">
                            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                <span className="material-symbols-outlined text-[18px] text-emerald-600">fingerprint</span>
                                File Integrity &amp; Fingerprint
                            </h2>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        SHA-256 Baseline
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(evidence.sha256_baseline)}
                                        className="text-xs font-medium text-secondary hover:underline"
                                    >
                                        Copy hash
                                    </button>
                                </div>
                                <div className="break-all rounded-lg bg-slate-50 p-3 font-mono text-sm leading-relaxed text-slate-900">
                                    {evidence.sha256_baseline}
                                </div>
                            </div>

                            {evidence.integrity_status === 'BASELINE_ESTABLISHED' && (
                                <p className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">
                                    This hash represents the evidence at the time it entered the controlled
                                    evidence system. It has not been re-verified — future integrity checks
                                    will compare the evidence against this baseline and record the result
                                    separately, without ever changing this value.
                                </p>
                            )}
                            {evidence.integrity_status === 'INTEGRITY_FAILURE' && (
                                <p className="rounded-lg bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                                    A verification check found that the evidence no longer matches this
                                    baseline. This does not by itself say what changed or when — see the
                                    verification history for details once that's available.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Evidence Lifecycle</h2>
                        <div className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                            <div className="flex flex-1 flex-col gap-0.5">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-900">Registered &amp; baseline established</span>
                                    <span className="font-mono text-xs text-slate-400">
                                        {new Date(evidence.registered_at).toLocaleString()}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    By {evidence.registered_by?.name ?? 'unknown user'}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Custody transfers, working copies, and verification checks aren't tracked yet —
                            they'll appear here once those systems are built.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
