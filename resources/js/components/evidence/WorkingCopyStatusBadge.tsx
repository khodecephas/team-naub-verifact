import { EvidenceDerivativeStatus } from "@/types/evidence";
import { cn } from "@/lib/utils";

const styles: Record<EvidenceDerivativeStatus, string> = {
    AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    DOWNLOADED: "border-blue-200 bg-blue-50 text-blue-700",
    EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
    REVOKED: "border-red-200 bg-red-50 text-red-700",
};

export function WorkingCopyStatusBadge({
    status,
}: {
    status: EvidenceDerivativeStatus;
}) {
    return (
        <span
            className={cn(
                "inline-flex rounded border px-2 py-1 text-[10px] font-bold tracking-wider",
                styles[status],
            )}
        >
            {status}
        </span>
    );
}
