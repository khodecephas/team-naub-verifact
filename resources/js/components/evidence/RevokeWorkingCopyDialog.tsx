import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Evidence, EvidenceDerivative } from "@/types/evidence";
import { router } from "@inertiajs/react";
import { useState } from "react";

export function RevokeWorkingCopyDialog({
    evidence,
    derivative,
}: {
    evidence: Evidence;
    derivative: EvidenceDerivative;
}) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const revoke = () => {
        router.post(
            EvidenceController.revokeDerivative({
                evidence: evidence.evidence_number,
                derivative: derivative.derivative_number,
            }).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50"
                >
                    Revoke
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Revoke {derivative.derivative_number}?
                    </DialogTitle>
                    <DialogDescription>
                        Download access will be cancelled and the temporary
                        server-side binary will be removed. The derivative
                        record, file hash, and chained event history will
                        remain.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-5 text-sm leading-6 text-slate-600">
                    This cannot remove a copy that has already been downloaded
                    to another device.
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={revoke}
                        disabled={processing}
                    >
                        {processing ? "Revoking…" : "Revoke working copy"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
