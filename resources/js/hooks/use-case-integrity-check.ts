import CaseIntegrityController from "@/actions/App/Http/Controllers/CaseIntegrityController";
import { router } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CaseIntegrityEvidenceResult {
    evidence_number: string;
    title: string;
    chain_verified: boolean;
    checked: boolean;
    matches_baseline: boolean | null;
    integrity_status: string;
}

export interface CaseIntegrityReportResult {
    report_number: string;
    title: string;
    content_verified: boolean;
}

export interface CaseIntegrityCheckResult {
    checked_at: string;
    evidence: CaseIntegrityEvidenceResult[];
    findings_chain_verified: boolean;
    reports: CaseIntegrityReportResult[];
}

type CheckState = "idle" | "checking" | "done" | "error";

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

/**
 * Runs the case-wide integrity sweep (evidence re-verification, custody
 * chains, findings chain, report content hashes — see
 * CaseIntegrityCheckService) automatically once per case page open.
 */
export function useCaseIntegrityCheck(caseNumber: string) {
    const [state, setState] = useState<CheckState>("idle");
    const [result, setResult] = useState<CaseIntegrityCheckResult | null>(null);
    const hasRun = useRef(false);

    const run = useCallback(async () => {
        setState("checking");

        try {
            const response = await fetch(CaseIntegrityController.verify(caseNumber).url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken(),
                },
            });

            if (!response.ok) {
                throw new Error(`Integrity check failed with status ${response.status}`);
            }

            const data = (await response.json()) as CaseIntegrityCheckResult;
            setResult(data);
            setState("done");

            // Refreshes the visible integrity badges/summary on this page
            // with whatever the sweep just re-verified, without a full reload.
            router.reload({ only: ["evidence", "integrity"] });
        } catch {
            setState("error");
        }
    }, [caseNumber]);

    useEffect(() => {
        if (hasRun.current) {
            return;
        }

        hasRun.current = true;
        void run();
    }, [run]);

    return { state, result, rerun: run };
}
