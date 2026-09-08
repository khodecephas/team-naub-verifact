import CaseController from '@/actions/App/Http/Controllers/CaseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import InputError from '@/Components/InputError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const MATTER_CATEGORIES = [
    'Intellectual Property & Data Theft',
    'Financial Fraud & AML',
    'Insider Threat / Intrusion',
    'Cyber Incident Response',
    'Subpoena Compliance',
    'Other Judicial Order',
];

const COMPLIANCE_STANDARDS = [
    'CJIS Policy Level 4',
    'Federal Rule of Evidence 902(11)/(14)',
    'ISO/IEC 27037 (Digital Evidence Handling)',
    'NIST SP 800-86',
];

/**
 * New-case intake form, adapted from a Stitch design. `CaseFile` only has
 * title/description/status/case_manager_id — everything else the design
 * collected (priority, matter category, docket ref, judicial authority,
 * discovery deadline, compliance standards, retention schedule) has no
 * column yet, so those values are folded into `description` on submit
 * rather than silently discarded or given a schema change nobody asked
 * for. Dropped rather than adapted: the fake pre-assigned case number (the
 * real one is only generated atomically at creation — see
 * IdentifierService), the 4-step wizard and "Save Draft"/"Continue to Team
 * Assignment" actions (this is one submission, and there's no
 * team-assignment page yet), the co-investigator picker (no user search
 * exists), the "Access Security Tier" selector (reads as an actual access
 * control we don't enforce), the "cryptographically sealed journal /
 * Ledger-Synchronized" claim (that's the custody hash-chain from a later,
 * unapproved phase — not built), and "Offline Intake Compatible" (out of
 * scope per the project spec).
 */
export default function Create({ auth }: PageProps) {
    const [summary, setSummary] = useState('');
    const [priority, setPriority] = useState('Standard — Routine Investigative Intake');
    const [category, setCategory] = useState(MATTER_CATEGORIES[0]);
    const [docketRef, setDocketRef] = useState('');
    const [judicialAuthority, setJudicialAuthority] = useState('');
    const [deadline, setDeadline] = useState('');
    const [standards, setStandards] = useState<string[]>([]);
    const [retentionPolicy, setRetentionPolicy] = useState('7 Years (Standard Federal Statute)');

    const { data, setData, post, processing, errors, transform } = useForm({
        title: '',
        description: '',
    });

    const toggleStandard = (standard: string) => {
        setStandards((prev) => (prev.includes(standard) ? prev.filter((s) => s !== standard) : [...prev, standard]));
    };

    const readinessChecks = [
        { label: 'Case title provided', ready: data.title.trim().length > 0 },
        { label: `Case lead confirmed (${auth.user.name})`, ready: true },
        { label: 'Investigative summary provided', ready: summary.trim().length > 0 },
    ];
    const readyCount = readinessChecks.filter((c) => c.ready).length;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const composedDescription = [
            summary.trim(),
            priority && `Priority: ${priority}`,
            category && `Matter category: ${category}`,
            docketRef && `Court docket / warrant ref: ${docketRef}`,
            judicialAuthority && `Issuing judicial authority: ${judicialAuthority}`,
            deadline && `Discovery production deadline: ${deadline}`,
            standards.length > 0 && `Compliance standards: ${standards.join(', ')}`,
            retentionPolicy && `Retention policy: ${retentionPolicy}`,
        ]
            .filter(Boolean)
            .join('\n');

        transform((formData) => ({ ...formData, description: composedDescription }));

        post(CaseController.store().url);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Case" />

            <div className="mx-auto px-6 py-8">
                <div className="flex flex-col gap-6 pb-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href={DashboardController.index()} className="flex items-center gap-1 transition-colors hover:text-slate-900">
                            <span className="material-symbols-outlined text-[16px]">folder</span>
                            Dashboard
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-slate-900">New Case Intake</span>
                    </nav>

                    <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-sm sm:p-8">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                            <span className="material-symbols-outlined text-[16px]">add_box</span>
                            Judicial Vault Protocol
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Investigative Case</h1>
                        <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
                            Open a case folder to anchor digital evidence and future chain-of-custody tracking. A
                            case number is assigned automatically once this form is submitted.
                        </p>
                    </div>

                    <form onSubmit={submit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        <div className="flex flex-col gap-6 lg:col-span-8">
                            {/* Section A */}
                            <div className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm sm:p-7">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                        A
                                    </span>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">
                                            Case Identification &amp; Classification
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Establish the formal title and initial classification.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            <span>Case Identifier</span>
                                        </label>
                                        <div className="flex h-10 items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-400">
                                            Assigned automatically on creation
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Forensic Urgency &amp; Discovery Priority
                                        </label>
                                        <select
                                            id="priority"
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            <option>High Priority — Active Discovery Defense</option>
                                            <option>Urgent — Immediate Preservation Order</option>
                                            <option>Standard — Routine Investigative Intake</option>
                                            <option>Low — Archival Review &amp; Analysis</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Case Title / Operation Name <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            id="title"
                                            required
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Enter a clear, concise investigative title"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Investigative Matter Category <span className="text-destructive">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                            {MATTER_CATEGORIES.map((option) => (
                                                <label
                                                    key={option}
                                                    className="flex cursor-pointer items-center gap-3 rounded bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="matter_category"
                                                        checked={category === option}
                                                        onChange={() => setCategory(option)}
                                                        className="text-secondary"
                                                    />
                                                    <span className="text-sm text-slate-700">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label htmlFor="summary" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Executive Summary &amp; Investigative Objective
                                        </label>
                                        <textarea
                                            id="summary"
                                            rows={4}
                                            className="w-full resize-y rounded-md border border-border bg-white p-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            placeholder="State the underlying facts, target systems, or suspected breaches prompting this investigation…"
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </div>

                            {/* Section B */}
                            <div className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm sm:p-7">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                        B
                                    </span>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Legal Authority &amp; Case Governance</h2>
                                        <p className="text-xs text-slate-500">Optional — recorded as case notes.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="docket_ref" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Court Docket / Search Warrant Ref #
                                        </label>
                                        <Input
                                            id="docket_ref"
                                            value={docketRef}
                                            onChange={(e) => setDocketRef(e.target.value)}
                                            placeholder="e.g. 26-CR-9041"
                                            className="font-mono"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="authority" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Issuing Judicial Authority / District
                                        </label>
                                        <Input
                                            id="authority"
                                            value={judicialAuthority}
                                            onChange={(e) => setJudicialAuthority(e.target.value)}
                                            placeholder="e.g. Superior Court of California, County of SF"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Statutory Target / Discovery Production Deadline
                                        </label>
                                        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full sm:w-64" />
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Applicable Compliance Standards
                                        </label>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {COMPLIANCE_STANDARDS.map((standard) => (
                                                <label
                                                    key={standard}
                                                    className={`inline-flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                                                        standards.includes(standard)
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={standards.includes(standard)}
                                                        onChange={() => toggleStandard(standard)}
                                                        className="hidden"
                                                    />
                                                    {standard}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C */}
                            <div className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm sm:p-7">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                        C
                                    </span>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Retention</h2>
                                        <p className="text-xs text-slate-500">Recorded as a case note — not yet enforced automatically.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 md:w-1/2">
                                    <label htmlFor="retention" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Retention Policy Schedule
                                    </label>
                                    <select
                                        id="retention"
                                        className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                        value={retentionPolicy}
                                        onChange={(e) => setRetentionPolicy(e.target.value)}
                                    >
                                        <option>7 Years (Standard Federal Statute)</option>
                                        <option>10 Years (Major Financial Crime)</option>
                                        <option>Indefinite / Capital Defense Legal Hold</option>
                                        <option>3 Years (Internal Corporate Triage)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse items-center justify-between gap-4 pb-4 sm:flex-row">
                                <Button variant="outline" asChild>
                                    <Link href={DashboardController.index()}>
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing} size="lg">
                                    <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                                    {processing ? 'Creating…' : 'Create Case'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 lg:col-span-4">
                            <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <span className="material-symbols-outlined text-[20px] text-secondary">badge</span>
                                        Case Lead
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 rounded bg-slate-50 p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                        {auth.user.name
                                            .split(' ')
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">{auth.user.name}</div>
                                        <div className="text-xs text-slate-500">{auth.user.email}</div>
                                    </div>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-400">
                                    You'll be recorded as both the case's creator and its manager. There's no
                                    picker yet to assign someone else or add co-investigators.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">Intake Readiness</h3>
                                    <span className="text-sm font-semibold text-secondary">
                                        {readyCount} of {readinessChecks.length} ready
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-slate-900 transition-all"
                                        style={{ width: `${(readyCount / readinessChecks.length) * 100}%` }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5 pt-1 text-sm">
                                    {readinessChecks.map((check) => (
                                        <div key={check.label} className="flex items-start gap-2.5">
                                            <span
                                                className={`material-symbols-outlined text-[18px] ${
                                                    check.ready ? 'text-emerald-600' : 'text-slate-300'
                                                }`}
                                            >
                                                {check.ready ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <span className={check.ready ? 'text-slate-900' : 'text-slate-400'}>{check.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
