import { WorkingCopyStatusBadge } from "@/components/evidence/WorkingCopyStatusBadge";
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
import { formatBytes } from "@/lib/utils";
import { Evidence, EvidenceDerivative } from "@/types/evidence";

function formatDateTime(value: string | null): string {
    if (!value) return "Not recorded";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </dt>
            <dd className="break-words pt-1 text-sm font-semibold text-slate-800">
                {value}
            </dd>
        </div>
    );
}

export function WorkingCopyDetails({
    evidence,
    derivative,
}: {
    evidence: Evidence;
    derivative: EvidenceDerivative;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                    Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="font-mono">
                            {derivative.derivative_number}
                        </DialogTitle>
                        <WorkingCopyStatusBadge status={derivative.status} />
                    </div>
                    <DialogDescription>
                        Controlled derivative of protected master{" "}
                        {evidence.evidence_number}
                    </DialogDescription>
                </DialogHeader>

                <dl className="grid gap-5 p-5 sm:grid-cols-2">
                    <Detail
                        label="Derivative type"
                        value={derivative.derivative_type.replace(/_/g, " ")}
                    />
                    <Detail
                        label="File size"
                        value={formatBytes(derivative.file_size_bytes)}
                    />
                    <Detail
                        label="Issued to"
                        value={derivative.issued_to ?? "Not assigned"}
                    />
                    <Detail label="Created by" value={derivative.created_by} />
                    <Detail
                        label="Purpose"
                        value={derivative.purpose ?? "Not recorded"}
                    />
                    <Detail
                        label="Created"
                        value={formatDateTime(derivative.created_at)}
                    />
                    <Detail
                        label="Issued"
                        value={formatDateTime(derivative.issued_at)}
                    />
                    <Detail
                        label="Downloaded"
                        value={formatDateTime(derivative.downloaded_at)}
                    />
                    <Detail
                        label="Expires"
                        value={formatDateTime(derivative.expires_at)}
                    />
                    <Detail
                        label="Revoked"
                        value={formatDateTime(derivative.revoked_at)}
                    />
                    <div className="sm:col-span-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            File SHA-256
                        </dt>
                        <dd className="mt-1 flex items-start gap-2 rounded bg-slate-950 p-3 font-mono text-xs break-all text-slate-100">
                            <span className="flex-1">{derivative.sha256}</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-slate-800"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        derivative.sha256,
                                    )
                                }
                            >
                                Copy
                            </Button>
                        </dd>
                    </div>
                </dl>

                <div className="border-t border-slate-200 px-5 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tamper-evident history
                    </h3>
                    <div className="mt-3 flex flex-col gap-3">
                        {derivative.events.map((event) => (
                            <div
                                key={event.event_hash}
                                className="rounded border border-slate-200 p-3"
                            >
                                <div className="flex flex-wrap justify-between gap-2">
                                    <p className="text-xs font-bold text-slate-800">
                                        {event.event_type.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatDateTime(event.occurred_at)}
                                    </p>
                                </div>
                                <p className="pt-1 text-xs text-slate-500">
                                    Actor: {event.actor}
                                </p>
                                <p
                                    className="truncate pt-2 font-mono text-[10px] text-slate-400"
                                    title={event.event_hash}
                                >
                                    Event hash: {event.event_hash}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
