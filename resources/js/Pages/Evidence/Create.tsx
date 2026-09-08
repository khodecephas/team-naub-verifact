import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import InputError from '@/Components/InputError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface PhysicalSourceOption {
    id: number;
    label: string;
}

interface CreateProps {
    case: { id: number; case_number: string; title: string };
    physicalSources: PhysicalSourceOption[];
    evidenceTypes: string[];
    maxUploadSizeKb: number;
    auth: { user: { name: string; email: string } };
}

function formatMaxSize(kb: number): string {
    const mb = kb / 1024;
    return mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

/**
 * Registration form for a new master evidence file under one case, adapted
 * from a Stitch design. Several things in the source were changed for
 * correctness rather than ported as-is:
 *
 * - The source showed a pre-computed "Quick SHA-256" the instant a file was
 *   selected. That's not something we can honestly show — we never hash
 *   client-side, and the real baseline only exists after the server has
 *   stored and hashed the file (EvidenceHashService, Phase 3). Showing any
 *   hash before that would contradict the whole point of a
 *   server-established baseline, so the file preview here shows only real
 *   browser-provided facts (name, size, type) and no hash.
 * - "Upload files up to 64 GB" was a fabricated number. The real limit
 *   (`config('evidence.max_upload_size_kb')`) is passed from the
 *   controller and shown as-is.
 * - The 3-step wizard tracker implied a multi-page flow; registration is
 *   one submission, so it was dropped rather than faked.
 * - "Save Draft" was dropped — there's no draft-saving capability.
 * - The custody-timeline preview card and the examiner's fake
 *   terminal/location/hardware-token/NTP details were dropped — none of
 *   that exists yet (custody tracking is a later phase).
 * - Five metadata fields the source collected (source/seizure origin,
 *   acquisition timestamp, custodian, witness, warrant ref) have no
 *   database column yet — adding one felt like a bigger decision than
 *   "integrate this page," so instead of a no-op field or a silent schema
 *   change, their values are folded into the real `description` field on
 *   submit. Nothing typed into the form is lost, it just isn't split into
 *   discrete columns.
 */
export default function Create({
    case: caseFile,
    physicalSources,
    evidenceTypes,
    maxUploadSizeKb,
    auth,
}: CreateProps) {
    const [classification, setClassification] = useState<'digital' | 'physical'>('digital');
    const [sourceOrigin, setSourceOrigin] = useState('');
    const [acquiredAt, setAcquiredAt] = useState('');
    const [custodian, setCustodian] = useState(auth.user.name);
    const [witness, setWitness] = useState('');
    const [warrantRef, setWarrantRef] = useState('');
    const [handlingNotes, setHandlingNotes] = useState('');

    const { data, setData, post, processing, errors, transform } = useForm<{
        physical_source_id: string;
        title: string;
        description: string;
        evidence_type: string;
        file: File | null;
    }>({
        physical_source_id: '',
        title: '',
        description: '',
        evidence_type: evidenceTypes[0] ?? '',
        file: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const composedDescription = [
            handlingNotes.trim(),
            sourceOrigin && `Source/seizure origin: ${sourceOrigin}`,
            acquiredAt && `Acquired: ${acquiredAt}`,
            custodian && `Custodian: ${custodian}`,
            witness && `Witness: ${witness}`,
            warrantRef && `Warrant/authorization ref: ${warrantRef}`,
        ]
            .filter(Boolean)
            .join('\n');

        transform((formData) => ({ ...formData, description: composedDescription }));

        // forceFormData is required because a File is present — Inertia
        // otherwise defaults to a JSON-encoded request that can't carry it.
        post(EvidenceController.store(caseFile.case_number).url, { forceFormData: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Register Evidence" />

            <div className="mx-auto max-w-6xl px-6 py-8">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col justify-between gap-6 pb-2 lg:flex-row lg:items-end">
                        <div className="flex max-w-3xl flex-col gap-2">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                                Evidence Ingestion Form
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Register Evidence Item</h1>
                            <p className="text-sm text-slate-500">
                                Establish initial custody and calculate an immutable cryptographic SHA-256 hash
                                baseline for <span className="font-medium text-slate-700">{caseFile.case_number}</span>.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm">
                            <span className="material-symbols-outlined text-[22px] text-secondary">lock</span>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Storage</span>
                                <span className="text-sm font-semibold text-slate-900">Secure Vault</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        <div className="flex flex-col gap-8 lg:col-span-8">
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-slate-900">Evidence Classification</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label
                                        className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-all ${
                                            classification === 'digital'
                                                ? 'border-slate-900 bg-slate-50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-[18px] text-secondary">draft</span>
                                                <span className="text-sm font-semibold text-slate-900">Digital File Only</span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="classification"
                                                checked={classification === 'digital'}
                                                onChange={() => setClassification('digital')}
                                                className="h-4 w-4 text-secondary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Documents, recordings, archives, exports, and backup files with no
                                            associated physical exhibit.
                                        </p>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-all ${
                                            classification === 'physical'
                                                ? 'border-slate-900 bg-slate-50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        } ${physicalSources.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-[18px] text-secondary">hard_drive</span>
                                                <span className="text-sm font-semibold text-slate-900">Extracted From Physical Source</span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="classification"
                                                disabled={physicalSources.length === 0}
                                                checked={classification === 'physical'}
                                                onChange={() => setClassification('physical')}
                                                className="h-4 w-4 text-secondary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {physicalSources.length > 0
                                                ? 'Link this file to a physical exhibit already logged on this case.'
                                                : 'No physical sources are logged on this case yet.'}
                                        </p>
                                    </label>
                                </div>

                                {classification === 'physical' && physicalSources.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-1.5">
                                        <label htmlFor="physical_source_id" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Physical Source
                                        </label>
                                        <select
                                            id="physical_source_id"
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={data.physical_source_id}
                                            onChange={(e) => setData('physical_source_id', e.target.value)}
                                        >
                                            <option value="">Select a physical source…</option>
                                            {physicalSources.map((source) => (
                                                <option key={source.id} value={source.id}>
                                                    {source.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.physical_source_id} className="mt-1" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900">Upload Evidence File</h2>

                                <div className="relative flex flex-col items-center justify-center rounded-xl bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100">
                                    <input
                                        type="file"
                                        required
                                        aria-label="Evidence file"
                                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-secondary shadow-sm">
                                        <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                        Drag a file here or click to browse
                                    </h3>
                                    <p className="max-w-md text-xs text-slate-500">
                                        Files up to {formatMaxSize(maxUploadSizeKb)}. The SHA-256 baseline is
                                        calculated by the server once the file is stored.
                                    </p>
                                </div>
                                <InputError message={errors.file} />

                                {data.file && (
                                    <div className="rounded-lg bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-600">
                                                    <span className="material-symbols-outlined text-[22px]">description</span>
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-sm font-semibold text-slate-900">
                                                        {data.file.name}
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-500">
                                                        {data.file.type || 'unknown type'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                                                {formatBytes(data.file.size)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            <span>Case</span>
                                            <span className="text-[11px] font-normal normal-case text-slate-400">
                                                Locked to this registration
                                            </span>
                                        </label>
                                        <div className="flex h-10 items-center rounded-md border border-border bg-slate-50 px-3 text-sm text-slate-600">
                                            {caseFile.case_number} — {caseFile.title}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Evidence Title <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            id="title"
                                            required
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="evidence_type" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Evidence Type <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            id="evidence_type"
                                            required
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={data.evidence_type}
                                            onChange={(e) => setData('evidence_type', e.target.value)}
                                        >
                                            {evidenceTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.evidence_type} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="source_origin" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Source / Seizure Origin
                                        </label>
                                        <Input
                                            id="source_origin"
                                            value={sourceOrigin}
                                            onChange={(e) => setSourceOrigin(e.target.value)}
                                            placeholder="e.g. CFO workstation, /Volumes/Data/Exports"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="acquired_at" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Timestamp of Acquisition
                                        </label>
                                        <Input
                                            id="acquired_at"
                                            value={acquiredAt}
                                            onChange={(e) => setAcquiredAt(e.target.value)}
                                            placeholder="e.g. 08 Sep 2026, 10:42 EST"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="custodian" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Custodian / Examiner
                                        </label>
                                        <Input id="custodian" value={custodian} onChange={(e) => setCustodian(e.target.value)} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="witness" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Witness / Assisting Agent
                                        </label>
                                        <Input id="witness" value={witness} onChange={(e) => setWitness(e.target.value)} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="warrant_ref" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Warrant / Authorization Ref
                                        </label>
                                        <Input
                                            id="warrant_ref"
                                            value={warrantRef}
                                            onChange={(e) => setWarrantRef(e.target.value)}
                                            className="font-mono"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label htmlFor="handling_notes" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Forensic Handling Notes
                                        </label>
                                        <textarea
                                            id="handling_notes"
                                            rows={3}
                                            className="w-full resize-none rounded-md border border-border bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={handlingNotes}
                                            onChange={(e) => setHandlingNotes(e.target.value)}
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl bg-slate-100 p-6">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-white shadow-sm">
                                    <span className="material-symbols-outlined text-[22px]">lock</span>
                                </span>
                                <div>
                                    <span className="text-sm font-semibold text-slate-900">Evidence Protection Guarantee</span>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                        Once registered, this file is written to private storage and its SHA-256
                                        baseline is calculated from the stored copy. That baseline is never
                                        overwritten — later verification always compares against it.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse items-center justify-between gap-4 pb-4 sm:flex-row">
                                <Button variant="outline" asChild>
                                    <Link href={EvidenceController.index()}>
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing || !data.file} size="lg">
                                    <span className="material-symbols-outlined text-[20px]">verified</span>
                                    {processing ? 'Registering…' : 'Register Evidence'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 lg:col-span-4">
                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <h3 className="mb-3 text-sm font-semibold text-slate-900">Registering As</h3>
                                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                                        <span className="material-symbols-outlined text-[20px]">badge</span>
                                    </span>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-slate-900">{auth.user.name}</span>
                                        <span className="text-xs text-slate-500">{auth.user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">File Verification</h3>
                                    <span className="text-xs font-semibold text-emerald-600">READY</span>
                                </div>
                                <p className="mb-4 text-xs text-slate-500">
                                    Integrity will be calculated and permanently logged once the file is stored.
                                </p>
                                <div className="rounded-lg bg-slate-50 p-3.5">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <span>Digital Fingerprint</span>
                                        <span className="text-emerald-600">AUTO</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">Generated on registration</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
