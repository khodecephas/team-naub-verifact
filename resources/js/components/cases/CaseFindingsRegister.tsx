import FindingController from "@/actions/App/Http/Controllers/FindingController";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import type { CaseFindings } from "@/types/case";
import { Link } from "@inertiajs/react";

interface CaseFindingsRegisterProps {
    findings: CaseFindings;
    caseNumber: string;
    canRecordFinding: boolean;
}

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export function CaseFindingsRegister({ findings, caseNumber, canRecordFinding }: CaseFindingsRegisterProps) {
    return (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                            Findings & analysis
                        </h2>
                        <span
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase ${
                                findings.chain_verified
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[13px]">
                                verified_user
                            </span>
                            {findings.chain_verified ? "Chain verified" : "Review required"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        A hash-chained, append-only record of analyst findings. Once recorded, a finding cannot be
                        edited or removed.
                    </p>
                </div>
                <Button
                    variant="outline"
                    asChild={canRecordFinding}
                    disabled={!canRecordFinding}
                    title={canRecordFinding ? undefined : "You do not have access to record findings on this case"}
                >
                    {canRecordFinding ? (
                        <Link href={FindingController.create(caseNumber)}>
                            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                                add_notes
                            </span>
                            Record finding
                        </Link>
                    ) : (
                        <>
                            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                                add_notes
                            </span>
                            Record finding
                        </>
                    )}
                </Button>
            </header>

            <ol className="flex flex-col divide-y divide-slate-100 px-5">
                {findings.items.map((finding) => (
                    <li key={finding.finding_number} className="flex gap-3 py-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                policy
                            </span>
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-sm font-semibold text-slate-900">{finding.title}</p>
                                <time className="whitespace-nowrap text-xs text-slate-500">
                                    {dateTime(finding.occurred_at)}
                                </time>
                            </div>
                            <p className="pt-1 text-xs leading-5 text-slate-600">{finding.narrative}</p>
                            <p className="pt-1 text-xs text-slate-500">
                                {finding.finding_number} · Recorded by {finding.authored_by}
                                {finding.evidence ? ` · Regarding ${finding.evidence.evidence_number}` : ""}
                            </p>
                            {finding.attachment ? (
                                <a
                                    href={FindingController.downloadAttachment(finding.finding_number).url}
                                    className="mt-2 inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                                >
                                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                        attach_file
                                    </span>
                                    {finding.attachment.original_filename ?? "Attached document"}
                                    {finding.attachment.size_bytes ? (
                                        <span className="text-slate-400">
                                            · {formatBytes(finding.attachment.size_bytes)}
                                        </span>
                                    ) : null}
                                </a>
                            ) : null}
                        </div>
                    </li>
                ))}

                {findings.items.length === 0 ? (
                    <li className="py-6 text-sm text-slate-500">No findings have been recorded for this case.</li>
                ) : null}
            </ol>
        </section>
    );
}
