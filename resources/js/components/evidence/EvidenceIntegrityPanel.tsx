import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { HashDisplay } from '@/components/evidence/HashDisplay';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { Evidence, EvidenceVerification } from '@/types/evidence';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface EvidenceIntegrityPanelProps {
    evidence: Evidence;
    verifications: EvidenceVerification[];
    canVerify: boolean;
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function EvidenceIntegrityPanel({
    evidence,
    verifications,
    canVerify,
}: EvidenceIntegrityPanelProps) {
    const [verifying, setVerifying] = useState(false);
    const latestVerification = verifications[0];

    const verifyIntegrity = () => {
        router.post(
            EvidenceController.verify(evidence.evidence_number).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setVerifying(true),
                onFinish: () => setVerifying(false),
            },
        );
    };

    return (
        <Panel>
            <PanelHeader
                title="File integrity"
                description="SHA-256 comparison against the immutable registration baseline"
                action={<StatusBadge status={evidence.integrity_status} />}
            />
            <div className="flex flex-col gap-5 p-5 sm:p-6">
                <HashDisplay value={evidence.sha256_baseline} />

                {latestVerification ? (
                    <div
                        className={`rounded-md border p-4 ${
                            latestVerification.matches_baseline
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-red-200 bg-red-50'
                        }`}
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                                <span
                                    aria-hidden="true"
                                    className={`material-symbols-outlined text-2xl ${
                                        latestVerification.matches_baseline
                                            ? 'text-emerald-700'
                                            : 'text-red-700'
                                    }`}
                                >
                                    {latestVerification.matches_baseline ? 'verified' : 'gpp_bad'}
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        {latestVerification.matches_baseline
                                            ? 'Integrity verified'
                                            : 'Integrity failure detected'}
                                    </p>
                                    <p className="pt-1 text-xs leading-5 text-slate-600">
                                        Checked by {latestVerification.verified_by} on{' '}
                                        {formatDateTime(latestVerification.verified_at)}
                                    </p>
                                </div>
                            </div>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Check #{latestVerification.id}
                            </span>
                        </div>

                        <div className="grid gap-3 pt-4 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Baseline hash
                                </p>
                                <code className="block break-all pt-1 font-mono text-[10px] text-slate-700">
                                    {latestVerification.baseline_sha256}
                                </code>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Observed hash
                                </p>
                                <code className="block break-all pt-1 font-mono text-[10px] text-slate-700">
                                    {latestVerification.observed_sha256}
                                </code>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-900">Baseline established</p>
                        <p className="pt-1 text-xs leading-5 text-blue-800">
                            This file has not yet been rehashed. Run verification to compare its current bytes
                            with the registration baseline.
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-xs leading-5 text-slate-500">
                        Verification reads the private master file and records a new result. The baseline is
                        never overwritten.
                    </p>
                    <Button onClick={verifyIntegrity} disabled={!canVerify || verifying}>
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                            published_with_changes
                        </span>
                        {verifying ? 'Verifying…' : 'Verify integrity'}
                    </Button>
                </div>

                {verifications.length > 0 ? (
                    <details className="rounded-md border border-slate-200 bg-slate-50">
                        <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                            Verification history ({verifications.length})
                        </summary>
                        <div className="divide-y divide-slate-200 border-t border-slate-200">
                            {verifications.map((verification) => (
                                <div
                                    key={verification.id}
                                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <StatusBadge
                                            status={
                                                verification.matches_baseline
                                                    ? 'VERIFIED'
                                                    : 'INTEGRITY_FAILURE'
                                            }
                                        />
                                        <span className="text-xs text-slate-600">
                                            {verification.verified_by}
                                        </span>
                                    </div>
                                    <time className="text-xs text-slate-500">
                                        {formatDateTime(verification.verified_at)}
                                    </time>
                                </div>
                            ))}
                        </div>
                    </details>
                ) : null}
            </div>
        </Panel>
    );
}
