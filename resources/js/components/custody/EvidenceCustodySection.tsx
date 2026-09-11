import CustodyRequestController from '@/actions/App/Http/Controllers/CustodyRequestController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import InputError from '@/Components/InputError';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Evidence, EvidenceCustodyEvent, EvidenceCustodyRequest, EvidencePersonSummary } from '@/types/evidence';
import { useForm } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';

interface Props {
    evidence: Evidence;
    events: EvidenceCustodyEvent[];
    requests: EvidenceCustodyRequest[];
    eligibleCustodians: EvidencePersonSummary[];
    canRequest: boolean;
    canDirectTransfer: boolean;
    isCurrentCustodian: boolean;
    chainVerified: boolean;
}

const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));

export function EvidenceCustodySection({ evidence, events, requests, eligibleCustodians, canRequest, canDirectTransfer, isCurrentCustodian, chainVerified }: Props) {
    const [requestOpen, setRequestOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [reviewing, setReviewing] = useState<EvidenceCustodyRequest | null>(null);
    const requestForm = useForm({ purpose: '', requested_location: '' });
    const transferForm = useForm({ to_custodian_id: '', purpose: '', to_location: evidence.current_custody_location ?? '', notes: '' });
    const reviewForm = useForm({ review_notes: '' });

    const submitRequest = (event: FormEvent) => {
        event.preventDefault();
        requestForm.post(CustodyRequestController.store(evidence.evidence_number).url, {
            preserveScroll: true,
            onSuccess: () => { requestForm.reset(); setRequestOpen(false); },
        });
    };
    const submitTransfer = (event: FormEvent) => {
        event.preventDefault();
        transferForm.post(EvidenceController.transferCustody(evidence.evidence_number).url, {
            preserveScroll: true,
            onSuccess: () => { transferForm.reset(); setTransferOpen(false); },
        });
    };
    const review = (decision: 'approve' | 'reject') => {
        if (!reviewing) return;
        const url = decision === 'approve'
            ? CustodyRequestController.approve(reviewing.id).url
            : CustodyRequestController.reject(reviewing.id).url;
        reviewForm.post(url, { preserveScroll: true, onSuccess: () => { reviewForm.reset(); setReviewing(null); } });
    };

    return <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Chain of custody</h2><span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase ${chainVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}><span className="material-symbols-outlined text-[13px]">verified_user</span>{chainVerified ? 'Chain verified' : 'Review required'}</span></div><p className="mt-1 text-xs text-slate-500">Responsibility, requests, locations, and recorded handoffs.</p></div>
            <div className="flex flex-wrap gap-2">
                {isCurrentCustodian
                    ? <span className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-50 px-3 text-xs font-semibold text-blue-800"><span className="material-symbols-outlined text-[17px]">person_pin_circle</span>You currently hold custody</span>
                    : <Button variant="outline" onClick={() => setRequestOpen(true)} disabled={!canRequest}><span className="material-symbols-outlined text-[17px]">pending_actions</span>Request custody</Button>}
                {canDirectTransfer && <Button variant="outline" onClick={() => setTransferOpen(true)}><span className="material-symbols-outlined text-[17px]">swap_horiz</span>Transfer custody</Button>}
            </div>
        </header>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
            <Summary label="Current custodian" value={evidence.current_custodian?.name ?? 'Not assigned'} />
            <Summary label="Current location" value={evidence.current_custody_location ?? 'Not recorded'} icon={<span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>} />
            <Summary label="Custody since" value={events[0] ? dateTime(events[0].occurred_at) : dateTime(evidence.registered_at)} />
        </div>
        {requests.some((item) => item.status === 'PENDING') && <div className="border-t border-amber-200 bg-amber-50/60 p-5"><h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Pending requests</h3><div className="mt-3 grid gap-2">{requests.filter((item) => item.status === 'PENDING').map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{item.requester}</p><p className="mt-1 text-xs text-slate-600">{item.purpose}{item.requested_location ? ` · ${item.requested_location}` : ''}</p></div><div className="flex gap-2">{item.can_review && <Button size="sm" onClick={() => setReviewing(item)}>Review request</Button>}{item.can_cancel && <Button size="sm" variant="outline" onClick={() => reviewForm.post(CustodyRequestController.cancel(item.id).url, { preserveScroll: true })}>Cancel</Button>}{!item.can_review && !item.can_cancel && <span className="text-xs font-semibold text-amber-800">Awaiting current custodian</span>}</div></div>)}</div></div>}
        <div className="p-5"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Custody history</h3><ol className="mt-4 space-y-4">{events.map((item) => <li key={item.id} className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100"><span className="material-symbols-outlined text-[17px]">arrow_forward</span></span><div className="min-w-0 flex-1 border-b border-slate-100 pb-4"><div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><p className="text-sm font-semibold">{item.from_custodian ?? 'Initial intake'} → {item.to_custodian}</p><time className="text-xs text-slate-500">{dateTime(item.occurred_at)}</time></div><p className="mt-1 text-xs text-slate-600">{item.purpose}</p><p className="mt-1 text-xs text-slate-500">{item.from_location ?? 'Unrecorded'} → {item.to_location ?? 'Unrecorded'} · Recorded by {item.transferred_by}</p></div></li>)}{events.length === 0 && <li className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No custody transfers have been recorded.</li>}</ol></div>

        <Dialog open={requestOpen} onOpenChange={setRequestOpen}><DialogContent><DialogHeader><DialogTitle>Request custody</DialogTitle><DialogDescription>The current custodian will review this request before responsibility changes.</DialogDescription></DialogHeader><form onSubmit={submitRequest}><div className="grid gap-4 p-5"><Field label="Purpose" error={requestForm.errors.purpose}><textarea className="rounded-md border-slate-300 text-sm" rows={3} value={requestForm.data.purpose} onChange={(e) => requestForm.setData('purpose', e.target.value)} required /></Field><Field label="Requested location" error={requestForm.errors.requested_location}><input className="h-10 rounded-md border-slate-300 text-sm" value={requestForm.data.requested_location} onChange={(e) => requestForm.setData('requested_location', e.target.value)} /></Field></div><DialogFooter><Button type="button" variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button><Button disabled={requestForm.processing}>Send request</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}><DialogContent><DialogHeader><DialogTitle>Administrative custody transfer</DialogTitle><DialogDescription>This privileged action changes the authoritative custodian immediately and records the handoff.</DialogDescription></DialogHeader><form onSubmit={submitTransfer}><div className="grid gap-4 p-5"><Field label="New custodian" error={transferForm.errors.to_custodian_id}><select className="h-10 rounded-md border-slate-300 text-sm" value={transferForm.data.to_custodian_id} onChange={(e) => transferForm.setData('to_custodian_id', e.target.value)} required><option value="">Select case personnel</option>{eligibleCustodians.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Purpose"><input className="h-10 rounded-md border-slate-300 text-sm" value={transferForm.data.purpose} onChange={(e) => transferForm.setData('purpose', e.target.value)} required /></Field><Field label="Destination location"><input className="h-10 rounded-md border-slate-300 text-sm" value={transferForm.data.to_location} onChange={(e) => transferForm.setData('to_location', e.target.value)} /></Field></div><DialogFooter><Button type="button" variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button><Button disabled={transferForm.processing}>Record transfer</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={reviewing !== null} onOpenChange={(open) => !open && setReviewing(null)}><DialogContent><DialogHeader><DialogTitle>Review custody request</DialogTitle><DialogDescription>{reviewing?.requester} requested responsibility for this evidence. Approval transfers custody immediately.</DialogDescription></DialogHeader><div className="grid gap-3 p-5"><div className="rounded-md bg-slate-50 p-4 text-sm">{reviewing?.purpose}</div><Field label="Review notes"><textarea className="rounded-md border-slate-300 text-sm" rows={3} value={reviewForm.data.review_notes} onChange={(e) => reviewForm.setData('review_notes', e.target.value)} /></Field></div><DialogFooter><Button variant="outline" disabled={reviewForm.processing} onClick={() => review('reject')}><span className="material-symbols-outlined text-[17px]">close</span>Reject</Button><Button disabled={reviewForm.processing} onClick={() => review('approve')}><span className="material-symbols-outlined text-[17px]">check</span>Approve and transfer</Button></DialogFooter></DialogContent></Dialog>
    </section>;
}

function Summary({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
    return <div className="bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">{icon}{value}</p></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="grid gap-1.5 text-sm font-semibold">{label}{children}<InputError message={error} /></label>;
}
