import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CaseIntegrityCheckResult } from "@/hooks/use-case-integrity-check";
import { useState } from "react";

interface CaseIntegrityDialogProps {
    state: "idle" | "checking" | "done" | "error";
    result: CaseIntegrityCheckResult | null;
    onRerun: () => void;
}

const CHECKLIST = [
    { key: "evidence", label: "Evidence file hashes" },
    { key: "custody", label: "Chain of custody" },
    { key: "findings", label: "Findings ledger" },
    { key: "reports", label: "Report content hashes" },
] as const;

/**
 * Shown automatically whenever a case is opened — sweeps evidence
 * integrity, custody chains, the findings ledger, and report content
 * hashes together (see CaseIntegrityCheckService) rather than making the
 * user check each tab separately.
 */
export function CaseIntegrityDialog({ state, result, onRerun }: CaseIntegrityDialogProps) {
    const [dismissed, setDismissed] = useState(false);

    if (state === "idle" || dismissed) {
        return null;
    }

    const evidenceIssues = result?.evidence.filter((item) => item.checked && item.matches_baseline === false) ?? [];
    const chainIssues = result?.evidence.filter((item) => !item.chain_verified) ?? [];
    const reportIssues = result?.reports.filter((item) => !item.content_verified) ?? [];
    const uncheckedEvidence = result?.evidence.filter((item) => !item.checked) ?? [];
    const findingsOk = result?.findings_chain_verified ?? true;
    const hasIssues = evidenceIssues.length > 0 || chainIssues.length > 0 || reportIssues.length > 0 || !findingsOk;
    const checkedCount = result?.evidence.filter((item) => item.checked).length ?? 0;

    return (
        <Dialog open onOpenChange={(open) => !open && state !== "checking" && setDismissed(true)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {state === "checking"
                            ? "Running case integrity check…"
                            : state === "error"
                              ? "Integrity check could not complete"
                              : hasIssues
                                ? "Integrity issues found"
                                : "All items verified"}
                    </DialogTitle>
                    <DialogDescription>
                        This runs automatically whenever the case is opened — evidence, chain of custody, findings,
                        and reports.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 p-5">
                    {state === "checking" ? (
                        <ul className="grid gap-2">
                            {CHECKLIST.map((item) => (
                                <li key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined animate-spin text-[18px] text-blue-700"
                                    >
                                        progress_activity
                                    </span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    ) : state === "error" ? (
                        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            The check could not reach the server. Records were left exactly as they were —
                            try again once connectivity is confirmed.
                        </p>
                    ) : (
                        <>
                            <div
                                className={`flex items-center gap-3 rounded-md border p-4 ${hasIssues ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`material-symbols-outlined text-2xl ${hasIssues ? "text-red-700" : "text-emerald-700"}`}
                                >
                                    {hasIssues ? "gpp_bad" : "verified"}
                                </span>
                                <p className={`text-sm font-semibold ${hasIssues ? "text-red-900" : "text-emerald-900"}`}>
                                    {hasIssues
                                        ? "One or more issues require review — see below."
                                        : "Evidence hashes, custody chains, findings ledger, and reports all check out."}
                                </p>
                            </div>

                            <dl className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded border border-slate-200 p-3">
                                    <dt className="font-bold uppercase tracking-wider text-slate-500">Evidence</dt>
                                    <dd className="pt-1 text-slate-700">
                                        {checkedCount}/{result?.evidence.length ?? 0} re-verified,{" "}
                                        {evidenceIssues.length} mismatch{evidenceIssues.length === 1 ? "" : "es"}
                                    </dd>
                                </div>
                                <div className="rounded border border-slate-200 p-3">
                                    <dt className="font-bold uppercase tracking-wider text-slate-500">
                                        Chain of custody
                                    </dt>
                                    <dd className="pt-1 text-slate-700">
                                        {(result?.evidence.length ?? 0) - chainIssues.length}/{result?.evidence.length ?? 0} verified
                                    </dd>
                                </div>
                                <div className="rounded border border-slate-200 p-3">
                                    <dt className="font-bold uppercase tracking-wider text-slate-500">Findings</dt>
                                    <dd className="pt-1 text-slate-700">
                                        {findingsOk ? "Chain verified" : "Chain broken"}
                                    </dd>
                                </div>
                                <div className="rounded border border-slate-200 p-3">
                                    <dt className="font-bold uppercase tracking-wider text-slate-500">Reports</dt>
                                    <dd className="pt-1 text-slate-700">
                                        {(result?.reports.length ?? 0) - reportIssues.length}/{result?.reports.length ?? 0} verified
                                    </dd>
                                </div>
                            </dl>

                            {evidenceIssues.length > 0 || chainIssues.length > 0 || reportIssues.length > 0 ? (
                                <div className="grid gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                    {evidenceIssues.map((item) => (
                                        <p key={`hash-${item.evidence_number}`}>
                                            <strong>{item.evidence_number}</strong> — hash mismatch against its
                                            registration baseline.
                                        </p>
                                    ))}
                                    {chainIssues.map((item) => (
                                        <p key={`chain-${item.evidence_number}`}>
                                            <strong>{item.evidence_number}</strong> — custody chain verification
                                            failed.
                                        </p>
                                    ))}
                                    {reportIssues.map((item) => (
                                        <p key={`report-${item.report_number}`}>
                                            <strong>{item.report_number}</strong> — content no longer matches its
                                            recorded fingerprint.
                                        </p>
                                    ))}
                                </div>
                            ) : null}

                            {uncheckedEvidence.length > 0 ? (
                                <p className="text-xs text-slate-500">
                                    {uncheckedEvidence.length} item{uncheckedEvidence.length === 1 ? "" : "s"} shown
                                    with its last recorded status only — either you don&apos;t have verification
                                    rights on it, or its master file is unavailable.
                                </p>
                            ) : null}
                        </>
                    )}
                </div>

                <DialogFooter>
                    {state === "error" ? (
                        <Button variant="outline" onClick={onRerun}>
                            Retry
                        </Button>
                    ) : null}
                    <Button onClick={() => setDismissed(true)} disabled={state === "checking"}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
