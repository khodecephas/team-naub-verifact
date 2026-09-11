import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import InputError from '@/Components/InputError';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Evidence, EvidenceCustodyEvent, EvidencePersonSummary } from '@/types/evidence';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface EvidenceCustodyPanelProps {
    evidence: Evidence;
    events: EvidenceCustodyEvent[];
    eligibleCustodians: EvidencePersonSummary[];
    canTransfer: boolean;
    transferOpen: boolean;
    onTransferOpenChange: (open: boolean) => void;
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function EvidenceCustodyPanel({
    evidence,
    events,
    eligibleCustodians,
    canTransfer,
    transferOpen,
    onTransferOpenChange,
}: EvidenceCustodyPanelProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        to_custodian_id: '',
        purpose: '',
        to_location: evidence.current_custody_location ?? '',
        notes: '',
    });

    const submitTransfer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(EvidenceController.transferCustody(evidence.evidence_number).url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onTransferOpenChange(false);
            },
        });
    };

    return (
        <Panel>
            <PanelHeader
                title="Chain of custody"
                description="Current responsibility and recorded transfers"
                action={
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTransferOpenChange(!transferOpen)}
                        disabled={!canTransfer}
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                            swap_horiz
                        </span>
                        Transfer custody
                    </Button>
                }
            />

            <div className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2">
                <div className="bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Current custodian
                    </p>
                    <p className="pt-1 text-sm font-semibold text-slate-900">
                        {evidence.current_custodian?.name ?? evidence.registered_by?.name ?? 'Not assigned'}
                    </p>
                </div>
                <div className="bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Current location
                    </p>
                    <p className="pt-1 text-sm font-semibold text-slate-900">
                        {evidence.current_custody_location ?? 'Not recorded'}
                    </p>
                </div>
            </div>

            {transferOpen ? (
                <form onSubmit={submitTransfer} className="grid gap-4 border-b border-blue-200 bg-blue-50 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                            <span className="app-field-label">Transfer to</span>
                            <select
                                value={data.to_custodian_id}
                                onChange={(event) => setData('to_custodian_id', event.target.value)}
                                required
                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                            >
                                <option value="">Select assigned personnel</option>
                                {eligibleCustodians.map((custodian) => (
                                    <option key={custodian.id} value={custodian.id}>
                                        {custodian.name}
                                        {custodian.role ? ` — ${custodian.role.replace(/_/g, ' ')}` : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.to_custodian_id} />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="app-field-label">Destination location</span>
                            <input
                                value={data.to_location}
                                onChange={(event) => setData('to_location', event.target.value)}
                                placeholder="Evidence room, laboratory, or locker"
                                className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                            />
                            <InputError message={errors.to_location} />
                        </label>
                    </div>

                    <label className="flex flex-col gap-1.5">
                        <span className="app-field-label">Purpose</span>
                        <input
                            value={data.purpose}
                            onChange={(event) => setData('purpose', event.target.value)}
                            placeholder="Forensic examination, secure storage, court presentation…"
                            required
                            className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                        />
                        <InputError message={errors.purpose} />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="app-field-label">Transfer notes</span>
                        <textarea
                            value={data.notes}
                            onChange={(event) => setData('notes', event.target.value)}
                            rows={2}
                            className="rounded-md border border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"
                        />
                        <InputError message={errors.notes} />
                    </label>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onTransferOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Recording transfer…' : 'Record custody transfer'}
                        </Button>
                    </div>
                </form>
            ) : null}

            <ol className="flex flex-col divide-y divide-slate-100 px-5">
                {events.map((event) => (
                    <li key={event.id} className="flex gap-3 py-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                move_down
                            </span>
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-sm font-semibold text-slate-900">
                                    {event.from_custodian ?? 'Initial intake'} → {event.to_custodian}
                                </p>
                                <time className="whitespace-nowrap text-xs text-slate-500">
                                    {formatDateTime(event.occurred_at)}
                                </time>
                            </div>
                            <p className="pt-1 text-xs text-slate-600">{event.purpose}</p>
                            <p className="pt-1 text-xs text-slate-500">
                                {(event.from_location ?? 'Unrecorded location')}
                                {' → '}
                                {event.to_location ?? 'Unrecorded location'} · Recorded by{' '}
                                {event.transferred_by}
                            </p>
                            {event.notes ? (
                                <p className="pt-2 text-xs leading-5 text-slate-600">{event.notes}</p>
                            ) : null}
                        </div>
                    </li>
                ))}

                {events.length === 0 ? (
                    <li className="py-6 text-sm text-slate-500">
                        No transfers recorded. Initial custody remains with the registering officer.
                    </li>
                ) : null}
            </ol>
        </Panel>
    );
}
