import { Panel, PanelHeader } from "@/components/ui/panel";
import type { Evidence, EvidenceActivityLogEntry } from "@/types/evidence";

interface EvidenceActivityPanelProps {
    evidence: Evidence;
    events: EvidenceActivityLogEntry[];
}

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
    EVIDENCE_REGISTERED: { label: "Evidence registered", icon: "inventory_2" },
    OFFLINE_SYNC_COMPLETED: { label: "Synchronized from offline device", icon: "sync" },
    WORKING_COPY_CREATED: { label: "Working copy created", icon: "file_copy" },
    WORKING_COPY_ISSUED: { label: "Working copy issued", icon: "outbound" },
    WORKING_COPY_DOWNLOADED: { label: "Working copy downloaded", icon: "download" },
    WORKING_COPY_EXPIRED: { label: "Working copy expired", icon: "hourglass_disabled" },
    WORKING_COPY_REVOKED: { label: "Working copy revoked", icon: "block" },
};

function eventDetail(event: EvidenceActivityLogEntry): string | null {
    switch (event.event_type) {
        case "EVIDENCE_REGISTERED": {
            const hash = event.payload.sha256_baseline;

            return typeof hash === "string" ? `SHA-256 baseline: ${hash.slice(0, 16)}…` : null;
        }
        case "OFFLINE_SYNC_COMPLETED": {
            const matched = event.payload.hashes_matched === true;

            return matched
                ? "Client and server SHA-256 matched before this record was committed."
                : "Hash comparison recorded.";
        }
        default:
            return null;
    }
}

/**
 * Shows exactly when this record was stored and — for offline-collected
 * evidence — when it was later synchronized, plus the full hash-chained
 * activity ledger (EvidenceActivityEventService) for every lifecycle event
 * recorded against it.
 */
export function EvidenceActivityPanel({ evidence, events }: EvidenceActivityPanelProps) {
    const isOffline = evidence.collection_source === "OFFLINE";
    const hashesMatch = evidence.client_sha256 !== null && evidence.client_sha256 === evidence.sha256_baseline;

    return (
        <Panel>
            <PanelHeader
                title="Activity & provenance"
                description="Stored, synchronized, and audited history for this record"
            />

            {isOffline ? (
                <div className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2">
                    <div className="bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Collected</p>
                        <p className="pt-1 text-sm font-semibold text-slate-900">
                            {evidence.collected_at ? dateTime(evidence.collected_at) : "Not recorded"}
                        </p>
                        <p className="pt-0.5 text-xs text-slate-500">
                            Client-recorded while offline{evidence.collected_timezone ? ` (${evidence.collected_timezone})` : ""}
                        </p>
                    </div>
                    <div className="bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Synchronized</p>
                        <p className="pt-1 text-sm font-semibold text-slate-900">{dateTime(evidence.registered_at)}</p>
                        <p className="pt-0.5 text-xs text-slate-500">Recorded by the H1 server</p>
                    </div>
                    <div className="bg-white p-4 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Client vs. server SHA-256
                        </p>
                        <p
                            className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${hashesMatch ? "text-emerald-700" : "text-red-700"}`}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                                {hashesMatch ? "verified" : "gpp_bad"}
                            </span>
                            {hashesMatch ? "Match — hashed independently on both device and server" : "Mismatch recorded"}
                        </p>
                    </div>
                </div>
            ) : null}

            <ol className="flex flex-col divide-y divide-slate-100 px-5">
                {events.map((event) => {
                    const meta = EVENT_LABELS[event.event_type] ?? { label: event.event_type, icon: "history" };
                    const detail = eventDetail(event);

                    return (
                        <li key={event.id} className="flex gap-3 py-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                    {meta.icon}
                                </span>
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                                    <time className="whitespace-nowrap text-xs text-slate-500">
                                        {dateTime(event.occurred_at)}
                                    </time>
                                </div>
                                <p className="pt-1 text-xs text-slate-500">Recorded by {event.actor}</p>
                                {detail ? <p className="pt-1 text-xs leading-5 text-slate-600">{detail}</p> : null}
                            </div>
                        </li>
                    );
                })}

                {events.length === 0 ? (
                    <li className="py-6 text-sm text-slate-500">No activity has been recorded for this evidence.</li>
                ) : null}
            </ol>
        </Panel>
    );
}
