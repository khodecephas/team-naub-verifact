import { ReportSection } from '@/components/reports/ReportSection';

interface TechnicalEvidence {
    evidence_number: string;
    baseline_sha256: string;
    latest_observed_sha256: string | null;
    custody_events: { sequence_number: number; event_hash: string; previous_event_hash: string | null; hash_scheme_version: number }[];
    derivatives: { copy_id: string; sha256: string }[];
}

export function TechnicalAppendix({ evidence }: { evidence: TechnicalEvidence[] }) {
    return (
        <ReportSection number={8} title="Optional Technical Appendix">
            <p className="mb-4 text-xs text-slate-500">These values support technical review and are not required to understand the main report.</p>
            <div className="space-y-5">
                {evidence.map((item) => <article key={item.evidence_number} className="rounded border border-slate-200 p-4"><h3 className="font-mono text-xs font-bold">{item.evidence_number}</h3><Hash label="Registration fingerprint (SHA-256)" value={item.baseline_sha256} /><Hash label="Latest observed fingerprint" value={item.latest_observed_sha256 ?? 'No later verification'} />{item.custody_events.map((event) => <div key={event.sequence_number} className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs font-semibold">Custody event {event.sequence_number} · Scheme {event.hash_scheme_version}</p><Hash label="Event hash" value={event.event_hash} /><Hash label="Previous event hash" value={event.previous_event_hash ?? 'Initial event'} /></div>)}</article>)}
            </div>
        </ReportSection>
    );
}

function Hash({ label, value }: { label: string; value: string }) {
    return <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-all font-mono text-[10px] leading-5 text-slate-700">{value}</p></div>;
}
