import CaseController from "@/actions/App/Http/Controllers/CaseController";
import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";

const MATTER_CATEGORIES = [
    "Intellectual Property & Data Theft",
    "Financial Fraud & AML",
    "Insider Threat / Intrusion",
    "Cyber Incident Response",
    "Subpoena Compliance",
    "Other Judicial Order",
];

const COMPLIANCE_STANDARDS = [
    "CJIS Policy Level 4",
    "Federal Rule of Evidence 902(11)/(14)",
    "ISO/IEC 27037 (Digital Evidence Handling)",
    "NIST SP 800-86",
    "HIPAA Forensics Safe Harbor",
];

const WIZARD_STEPS = [
    { label: "Step 1 • Active", title: "Details & Classification" },
    { label: "Step 2", title: "Team & Lead Custodian" },
    { label: "Step 3", title: "Legal Authority & Jurisdiction" },
    { label: "Step 4 • Optional", title: "Initial Evidence Ingestion" },
];

const SECURITY_TIERS = [
    "Restricted — Authorized Case Investigators Only",
    "Confidential — Agency-Wide Forensics View",
    "Strict Airgap — Lead Custodian & Legal Counsel Only",
];

/**
 * New-case intake form, reworked against the literal Stitch source (not a
 * paraphrase of it) to match it exactly. `CaseFile` only has
 * title/description/status/case_manager_id — everything else the design
 * collected (priority, matter category, docket ref, judicial authority,
 * discovery deadline, compliance standards, retention schedule) has no
 * column yet, so those values are folded into `description` on submit
 * rather than silently discarded or given a schema change nobody asked
 * for.
 *
 * Restored as visually-present-but-inert: the 4-step wizard tracker (this
 * form is still one submission — steps 2-4 are decorative), "Save Draft"
 * and "Continue to Team Assignment" (disabled — no draft persistence or
 * team-assignment page exists), the co-investigator picker (disabled — no
 * user search exists yet), "Supervised Department" (shown as untracked
 * rather than a fabricated division name), and the "Access Security Tier"
 * selector (disabled — the design implies real per-tier access
 * enforcement we don't have, so it's shown but inert rather than either
 * hidden or silently functional).
 *
 * Kept but corrected rather than shown as-is: the fake pre-assigned case
 * number (the real one is only generated atomically at creation — see
 * IdentifierService, so the field shows a "Vault Schema" placeholder
 * instead of a specific fabricated ID) and the "Immutable Case Anchor" /
 * "Ledger-Synchronized" card, whose copy claimed a cryptographic custody
 * journal is created automatically — that's the custody hash-chain from
 * an unapproved later phase, not built, so the card stays but says "Not
 * Yet Active" instead of asserting it's ready. "Offline Intake Compatible"
 * stays out entirely — explicitly out of scope per the project spec's
 * deferred offline module, not just a UI element without a controller.
 */
export default function Create({ auth }: PageProps) {
    const [summary, setSummary] = useState("");
    const [priority, setPriority] = useState(
        "Standard — Routine Investigative Intake",
    );
    const [category, setCategory] = useState(MATTER_CATEGORIES[0]);
    const [docketRef, setDocketRef] = useState("");
    const [judicialAuthority, setJudicialAuthority] = useState("");
    const [deadline, setDeadline] = useState("");
    const [standards, setStandards] = useState<string[]>([]);
    const [retentionPolicy, setRetentionPolicy] = useState(
        "7 Years (Standard Federal Statute)",
    );

    const { data, setData, post, processing, errors, transform } = useForm({
        title: "",
        description: "",
    });

    const toggleStandard = (standard: string) => {
        setStandards((prev) =>
            prev.includes(standard)
                ? prev.filter((s) => s !== standard)
                : [...prev, standard],
        );
    };

    const readinessChecks = [
        {
            label: "Case title & matter classification provided",
            ready: data.title.trim().length > 0,
        },
        { label: `Lead custodian confirmed (${auth.user.name})`, ready: true },
        {
            label: docketRef
                ? `Docket reference (${docketRef}) documented`
                : "Docket reference documented",
            ready: docketRef.trim().length > 0,
        },
    ];
    const readyCount = readinessChecks.filter((c) => c.ready).length;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const composedDescription = [
            summary.trim(),
            priority && `Priority: ${priority}`,
            category && `Matter category: ${category}`,
            docketRef && `Court docket / warrant ref: ${docketRef}`,
            judicialAuthority &&
                `Issuing judicial authority: ${judicialAuthority}`,
            deadline && `Discovery production deadline: ${deadline}`,
            standards.length > 0 &&
                `Compliance standards: ${standards.join(", ")}`,
            retentionPolicy && `Retention policy: ${retentionPolicy}`,
        ]
            .filter(Boolean)
            .join("\n");

        transform((formData) => ({
            ...formData,
            description: composedDescription,
        }));

        post(CaseController.store().url);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Case" />

            <div>
                <div className="flex flex-col gap-4 pb-4">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <nav className="flex items-center gap-2 text-xs text-slate-500">
                            <Link
                                href={CaseController.index()}
                                className="flex items-center gap-1 transition-colors hover:text-slate-900"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    folder
                                </span>
                                Cases
                            </Link>
                            <span className="text-slate-300">/</span>
                            <span className="font-semibold text-slate-900">
                                New Case Intake
                            </span>
                        </nav>
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-2 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                                <span className="h-2 w-2 rounded-full bg-secondary" />
                                Case Status: Draft / Initial Intake
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                                <span className="material-symbols-outlined text-[14px] text-secondary">
                                    verified_user
                                </span>
                                Secured Intake Pipeline
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                            <span className="material-symbols-outlined text-[16px]">
                                add_box
                            </span>
                            Judicial Vault Protocol
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                            Create New Investigative Case
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                            Open a secured judicial case folder to anchor
                            digital evidence, chain-of-custody tracking, and
                            forensic verification reports. All actions are
                            audit-recorded to support evidentiary review.
                        </p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {WIZARD_STEPS.map((step, i) => (
                                <div
                                    key={step.title}
                                    className={`flex items-center gap-3 rounded p-2 ${i === 0 ? "bg-slate-50" : "opacity-70"}`}
                                    title={
                                        i === 0
                                            ? undefined
                                            : "Not available yet — this form is a single step"
                                    }
                                >
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-semibold ${
                                            i === 0
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div className="min-w-0">
                                        <div
                                            className={`text-[11px] font-semibold uppercase tracking-wider ${i === 0 ? "text-secondary" : "text-slate-400"}`}
                                        >
                                            {step.label}
                                        </div>
                                        <div className="truncate text-sm font-semibold text-slate-900">
                                            {step.title}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12"
                    >
                        <div className="flex flex-col gap-4 lg:col-span-8">
                            {/* Section A */}
                            <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                            A
                                        </span>
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">
                                                Case Identification &amp;
                                                Classification
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Establish formal operational
                                                nomenclature and forensic
                                                priority.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded bg-slate-100 px-2.5 py-1 font-mono text-xs text-secondary">
                                        SEC-LEVEL: FORMAL
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            <span>Unique Case Identifier</span>
                                            <span className="flex items-center gap-1 font-mono text-[11px] font-normal normal-case text-secondary">
                                                <span className="material-symbols-outlined text-[13px]">
                                                    lock
                                                </span>
                                                Vault Schema
                                            </span>
                                        </label>
                                        <div className="relative flex h-10 items-center rounded-md border border-border bg-slate-50 px-3 font-mono text-sm text-slate-400">
                                            Assigned on save
                                            <button
                                                type="button"
                                                disabled
                                                title="Nothing to copy until the case is created"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    content_copy
                                                </span>
                                            </button>
                                        </div>
                                        <span className="font-mono text-[11px] text-slate-400">
                                            Auto-assigned sequentially by the
                                            evidence vault schema on save.
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="priority"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Forensic Urgency &amp; Discovery
                                            Priority
                                        </label>
                                        <select
                                            id="priority"
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={priority}
                                            onChange={(e) =>
                                                setPriority(e.target.value)
                                            }
                                        >
                                            <option>
                                                High Priority — Active Discovery
                                                Defense
                                            </option>
                                            <option>
                                                Urgent — Immediate Preservation
                                                Order
                                            </option>
                                            <option>
                                                Standard — Routine Investigative
                                                Intake
                                            </option>
                                            <option>
                                                Low — Archival Review &amp;
                                                Analysis
                                            </option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label
                                            htmlFor="title"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Case Title / Operation Name{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </label>
                                        <Input
                                            id="title"
                                            required
                                            value={data.title}
                                            onChange={(e) =>
                                                setData("title", e.target.value)
                                            }
                                            placeholder="Enter a clear, concise investigative title"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Investigative Matter Category{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                                        checked={
                                                            category === option
                                                        }
                                                        onChange={() =>
                                                            setCategory(option)
                                                        }
                                                        className="text-secondary"
                                                    />
                                                    <span className="text-sm text-slate-700">
                                                        {option}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label
                                            htmlFor="summary"
                                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            <span>
                                                Executive Summary &amp;
                                                Investigative Objective
                                            </span>
                                            <span className="font-mono text-[11px] font-normal normal-case text-slate-400">
                                                Plaintext Factual Record
                                            </span>
                                        </label>
                                        <textarea
                                            id="summary"
                                            rows={4}
                                            className="w-full resize-y rounded-md border border-border bg-white p-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            placeholder="State the underlying facts, trigger notifications, target systems, or suspected breaches prompting this digital investigation…"
                                            value={summary}
                                            onChange={(e) =>
                                                setSummary(e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section B */}
                            <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                            B
                                        </span>
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">
                                                Legal Authority &amp; Case
                                                Governance
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Ground digital artifacts under
                                                authorized court mandates and
                                                procedural standards — recorded
                                                as case notes.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1 font-mono text-xs text-emerald-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        COURT-READY
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="docket_ref"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Court Docket / Search Warrant Ref #
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="docket_ref"
                                                value={docketRef}
                                                onChange={(e) =>
                                                    setDocketRef(e.target.value)
                                                }
                                                placeholder="e.g. 26-CR-9041 or WARRANT-NYSD-401"
                                                className="pr-9 font-mono"
                                            />
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                                                gavel
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="authority"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Issuing Judicial Authority /
                                            District
                                        </label>
                                        <Input
                                            id="authority"
                                            value={judicialAuthority}
                                            onChange={(e) =>
                                                setJudicialAuthority(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. Superior Court of California, County of SF"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label
                                            htmlFor="deadline"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Statutory Target / Discovery
                                            Production Deadline
                                        </label>
                                        <Input
                                            id="deadline"
                                            type="date"
                                            value={deadline}
                                            onChange={(e) =>
                                                setDeadline(e.target.value)
                                            }
                                            className="w-full sm:w-64"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Mandatory Admissibility &amp;
                                            Compliance Standards
                                        </label>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {COMPLIANCE_STANDARDS.map(
                                                (standard) => (
                                                    <label
                                                        key={standard}
                                                        className={`inline-flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                                                            standards.includes(
                                                                standard,
                                                            )
                                                                ? "bg-slate-900 text-white"
                                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={standards.includes(
                                                                standard,
                                                            )}
                                                            onChange={() =>
                                                                toggleStandard(
                                                                    standard,
                                                                )
                                                            }
                                                            className="hidden"
                                                        />
                                                        {standard}
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C */}
                            <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-700">
                                            C
                                        </span>
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">
                                                Initial Security &amp; Retention
                                                Settings
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Recorded as case notes — not yet
                                                enforced automatically.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-xs text-slate-400">
                                        IMMUTABLE VAULT DEFAULTS
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="retention"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Retention Policy Schedule
                                        </label>
                                        <select
                                            id="retention"
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={retentionPolicy}
                                            onChange={(e) =>
                                                setRetentionPolicy(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option>
                                                7 Years (Standard Federal
                                                Statute)
                                            </option>
                                            <option>
                                                10 Years (Major Financial Crime)
                                            </option>
                                            <option>
                                                Indefinite / Capital Defense
                                                Legal Hold
                                            </option>
                                            <option>
                                                3 Years (Internal Corporate
                                                Triage)
                                            </option>
                                        </select>
                                        <span className="font-mono text-[11px] text-slate-400">
                                            Retention lock prevents accidental
                                            purge until court clearance.
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="security_tier"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Access Security Tier
                                        </label>
                                        <select
                                            id="security_tier"
                                            disabled
                                            defaultValue={SECURITY_TIERS[0]}
                                            title="Per-tier access enforcement isn't implemented yet"
                                            className="h-10 w-full cursor-not-allowed rounded-md border border-border bg-slate-50 px-3 text-sm text-slate-400 shadow-sm focus:outline-none"
                                        >
                                            {SECURITY_TIERS.map((tier) => (
                                                <option key={tier}>
                                                    {tier}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="font-mono text-[11px] text-slate-400">
                                            Not enforced yet — informational
                                            only.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-4 z-20 mt-2 flex flex-col-reverse items-center justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                                    <Button variant="outline" asChild>
                                        <Link href={CaseController.index()}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                close
                                            </span>
                                            Cancel &amp; Discard
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled
                                        title="Draft persistence isn't available yet"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            save
                                        </span>
                                        Save Draft
                                    </Button>
                                </div>
                                <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled
                                        title="Team assignment isn't available yet"
                                    >
                                        Continue to Team Assignment
                                        <span className="material-symbols-outlined text-[18px]">
                                            arrow_forward
                                        </span>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="lg"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            create_new_folder
                                        </span>
                                        {processing
                                            ? "Creating…"
                                            : "Create Case & Open Vault"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 lg:col-span-4">
                            <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <span className="material-symbols-outlined text-[20px] text-secondary">
                                            badge
                                        </span>
                                        Case Lead &amp; Custody
                                    </h3>
                                    <span className="font-mono text-xs text-slate-400">
                                        ASSIGNED
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 rounded bg-slate-50 p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                        {auth.user.name
                                            .split(" ")
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">
                                            {auth.user.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Lead Custodian
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        Supervised Department
                                    </span>
                                    <span className="text-sm font-medium text-slate-300">
                                        Not tracked yet
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        <span>
                                            Co-Investigators &amp; Specialists
                                        </span>
                                        <button
                                            type="button"
                                            disabled
                                            title="Team assignment isn't available yet"
                                            className="font-mono text-[11px] font-normal normal-case text-slate-300"
                                        >
                                            + Add Member
                                        </button>
                                    </label>
                                    <p className="text-xs text-slate-400">
                                        No co-investigators added yet.
                                    </p>
                                </div>
                            </div>

                            <div className="relative flex flex-col gap-3 overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                                        <span className="material-symbols-outlined text-[22px]">
                                            security
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Immutable Case Anchor
                                        </h3>
                                        <div className="font-mono text-xs text-slate-400">
                                            Not Yet Active
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-500">
                                    Once available, this case folder will
                                    generate a cryptographically sealed journal
                                    that evidence items, verification
                                    certificates, and custody handoffs
                                    automatically reference for court-ready
                                    attestation.
                                </p>
                                <div className="flex items-center gap-2.5 rounded bg-slate-50 p-3 font-mono text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                                        info
                                    </span>
                                    <span>
                                        ISO/IEC 27037 journal: not yet available
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Intake Readiness
                                    </h3>
                                    <span className="text-sm font-semibold text-secondary">
                                        {readyCount} of {readinessChecks.length}{" "}
                                        ready
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-slate-900 transition-all"
                                        style={{
                                            width: `${(readyCount / readinessChecks.length) * 100}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5 pt-1 text-sm">
                                    {readinessChecks.map((check) => (
                                        <div
                                            key={check.label}
                                            className="flex items-start gap-2.5"
                                        >
                                            <span
                                                className={`material-symbols-outlined text-[18px] ${
                                                    check.ready
                                                        ? "text-emerald-600"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {check.ready
                                                    ? "check_circle"
                                                    : "radio_button_unchecked"}
                                            </span>
                                            <span
                                                className={
                                                    check.ready
                                                        ? "text-slate-900"
                                                        : "text-slate-400"
                                                }
                                            >
                                                {check.label}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-[18px] text-slate-300">
                                            radio_button_unchecked
                                        </span>
                                        <span className="text-slate-400">
                                            Initial evidence items attached (0
                                            pending, optional)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
