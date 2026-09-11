import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Evidence, EvidencePersonSummary } from "@/types/evidence";
import { useForm } from "@inertiajs/react";
import { FormEvent } from "react";

interface IssueWorkingCopyDialogProps {
    evidence: Evidence;
    recipients: EvidencePersonSummary[];
    retention: {
        default: number;
        options: number[];
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function retentionLabel(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minutes`;
    }

    if (minutes === 60) {
        return "1 hour";
    }

    if (minutes < 1440) {
        return `${minutes / 60} hours`;
    }

    return `${minutes / 1440} day`;
}

export function IssueWorkingCopyDialog({
    evidence,
    recipients,
    retention,
    open,
    onOpenChange,
}: IssueWorkingCopyDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        issued_to: "",
        purpose: "",
        retention_minutes: String(retention.default),
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(
            EvidenceController.issueWorkingCopy(evidence.evidence_number).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Issue controlled working copy</DialogTitle>
                        <DialogDescription>
                            A controlled working copy will be generated from the
                            protected master, assigned a unique derivative ID,
                            hashed, and recorded in the evidence history.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 p-5">
                        <label className="flex flex-col gap-1.5">
                            <span className="app-field-label">Issued to</span>
                            <select
                                required
                                value={data.issued_to}
                                onChange={(event) =>
                                    setData("issued_to", event.target.value)
                                }
                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                            >
                                <option value="">
                                    Select an authorised recipient
                                </option>
                                {recipients.map((recipient) => (
                                    <option
                                        key={recipient.id}
                                        value={recipient.id}
                                    >
                                        {recipient.name}
                                        {recipient.role
                                            ? ` — ${recipient.role.replace(/_/g, " ")}`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.issued_to} />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="app-field-label">Purpose</span>
                            <textarea
                                required
                                rows={3}
                                value={data.purpose}
                                onChange={(event) =>
                                    setData("purpose", event.target.value)
                                }
                                placeholder="Describe the approved examination, review, or analysis purpose"
                                className="rounded-md border border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"
                            />
                            <InputError message={errors.purpose} />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="app-field-label">
                                Available for
                            </span>
                            <select
                                value={data.retention_minutes}
                                onChange={(event) =>
                                    setData(
                                        "retention_minutes",
                                        event.target.value,
                                    )
                                }
                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                            >
                                {retention.options.map((minutes) => (
                                    <option key={minutes} value={minutes}>
                                        {retentionLabel(minutes)}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.retention_minutes} />
                        </label>

                        <p className="rounded border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                            The temporary server copy is removed after download
                            or expiry. A file already downloaded to another
                            device remains outside this application&apos;s
                            storage control.
                        </p>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={processing || recipients.length === 0}
                        >
                            {processing ? "Issuing…" : "Issue working copy"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
