import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import InputError from '@/Components/InputError';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Evidence, EvidenceIntakeCase } from '@/types/evidence';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface EvidenceIntakeCompletionProps {
    evidence: Evidence;
    cases: EvidenceIntakeCase[];
    evidenceTypes: string[];
}

export function EvidenceIntakeCompletion({
    evidence,
    cases,
    evidenceTypes,
}: EvidenceIntakeCompletionProps) {
    const { data, setData, patch, processing, errors } = useForm({
        case_id: '',
        physical_source_id: '',
        evidence_type: '',
        description: '',
    });
    const selectedCase = cases.find((caseFile) => caseFile.id === Number(data.case_id));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        patch(EvidenceController.completeIntake(evidence.evidence_number).url, {
            preserveScroll: true,
        });
    };

    return (
        <Panel className="border-amber-300 shadow-md">
            <PanelHeader
                title="Complete evidence intake"
                description="This secured record is awaiting case assignment and classification"
                action={
                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Action required
                    </span>
                }
            />

            <form onSubmit={submit} className="grid gap-4 p-5 lg:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Permanent title
                    </p>
                    <p className="pt-1 text-sm font-semibold text-slate-900">{evidence.title}</p>
                    <p className="pt-1 text-xs text-slate-500">
                        Quick-ingest titles are derived from the original filename and cannot be changed here.
                    </p>
                </div>

                <label className="flex flex-col gap-1.5">
                    <span className="app-field-label">Case assignment</span>
                    <select
                        value={data.case_id}
                        onChange={(event) => {
                            setData((current) => ({
                                ...current,
                                case_id: event.target.value,
                                physical_source_id: '',
                            }));
                        }}
                        required
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                    >
                        <option value="">Select an authorised case</option>
                        {cases.map((caseFile) => (
                            <option key={caseFile.id} value={caseFile.id}>
                                {caseFile.case_number} — {caseFile.title}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.case_id} />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="app-field-label">Evidence classification</span>
                    <select
                        value={data.evidence_type}
                        onChange={(event) => setData('evidence_type', event.target.value)}
                        required
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                    >
                        <option value="">Select a classification</option>
                        {evidenceTypes
                            .filter((type) => type !== 'OTHER')
                            .map((type) => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ')}
                                </option>
                            ))}
                    </select>
                    <InputError message={errors.evidence_type} />
                </label>

                <label className="flex flex-col gap-1.5 lg:col-span-2">
                    <span className="app-field-label">Physical source</span>
                    <select
                        value={data.physical_source_id}
                        onChange={(event) => setData('physical_source_id', event.target.value)}
                        disabled={!selectedCase}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                        <option value="">No physical source / direct digital intake</option>
                        {selectedCase?.physical_sources.map((source) => (
                            <option key={source.id} value={source.id}>
                                {source.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.physical_source_id} />
                </label>

                <label className="flex flex-col gap-1.5 lg:col-span-2">
                    <span className="app-field-label">Collection and intake notes</span>
                    <textarea
                        value={data.description}
                        onChange={(event) => setData('description', event.target.value)}
                        rows={4}
                        placeholder="Record acquisition context, source, authority, and handling notes"
                        className="rounded-md border border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"
                    />
                    <InputError message={errors.description} />
                </label>

                <div className="flex justify-end lg:col-span-2">
                    <Button type="submit" disabled={processing || cases.length === 0}>
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                            assignment_turned_in
                        </span>
                        {processing ? 'Completing intake…' : 'Complete intake and attach to case'}
                    </Button>
                </div>
            </form>
        </Panel>
    );
}
