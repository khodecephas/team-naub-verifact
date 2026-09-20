import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EvidenceVerification } from "@/types/evidence";

interface EvidenceAutoVerifyDialogProps {
    open: boolean;
    verifying: boolean;
    evidenceNumber: string;
    latestVerification: EvidenceVerification | undefined;
    onClose: () => void;
}

/**
 * Shown automatically whenever an authorised user opens an evidence record
 * — the same server-side re-hash the manual "Verify integrity" button
 * triggers, just fired on mount instead of a click, with progress and the
 * result surfaced here rather than only in the page's own panel.
 */
export function EvidenceAutoVerifyDialog({
    open,
    verifying,
    evidenceNumber,
    latestVerification,
    onClose,
}: EvidenceAutoVerifyDialogProps) {
    const matches = latestVerification?.matches_baseline ?? null;

    return (
        <Dialog open={open} onOpenChange={(next) => !next && !verifying && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {verifying
                            ? "Verifying integrity…"
                            : matches
                              ? "Integrity verified"
                              : matches === false
                                ? "Integrity failure detected"
                                : "Verification could not run"}
                    </DialogTitle>
                    <DialogDescription>
                        This check runs automatically whenever this evidence record is opened.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-5">
                    {verifying ? (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span
                                aria-hidden="true"
                                className="material-symbols-outlined animate-spin text-[22px] text-blue-700"
                            >
                                progress_activity
                            </span>
                            Re-hashing {evidenceNumber} and comparing it against its registration baseline…
                        </div>
                    ) : (
                        <div
                            className={`flex items-start gap-3 rounded-md border p-4 ${
                                matches === true
                                    ? "border-emerald-200 bg-emerald-50"
                                    : matches === false
                                      ? "border-red-200 bg-red-50"
                                      : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`material-symbols-outlined text-2xl ${
                                    matches === true
                                        ? "text-emerald-700"
                                        : matches === false
                                          ? "text-red-700"
                                          : "text-slate-500"
                                }`}
                            >
                                {matches === true ? "verified" : matches === false ? "gpp_bad" : "help"}
                            </span>
                            <p className="text-sm leading-6 text-slate-700">
                                {matches === true
                                    ? "The current master file matches the SHA-256 hash recorded at registration. No change was detected."
                                    : matches === false
                                      ? "The current master file does not match its registration baseline. This has been recorded and requires review."
                                      : "The master file could not be read for verification. Its current integrity status is unchanged."}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose} disabled={verifying}>
                        {matches === false ? "Acknowledge" : "Close"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
