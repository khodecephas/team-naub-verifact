import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect, useState } from "react";

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
 * Registration form for a new master evidence file under one case. Reworked
 * against the literal Stitch source (not a paraphrase of it) to match it
 * exactly, with these deliberate exceptions:
 *
 * - The source showed a pre-computed "Quick SHA-256" the instant a file was
 *   selected, badged "VERIFIED BY INGEST STREAM". That's not something we
 *   can honestly show — we never hash client-side, and the real baseline
 *   only exists after the server has stored and hashed the file
 *   (EvidenceHashService, Phase 3). Showing any hash before that would
 *   contradict the whole point of a server-established baseline, so the
 *   file preview here shows only real browser-provided facts (name, size,
 *   type) and no hash or verification badge.
 * - "Upload files up to 64 GB" was a fabricated number. The real limit
 *   (`config('evidence.max_upload_size_kb')`) is passed from the
 *   controller and shown in its place, same wording otherwise.
 * - The Examiner Attestation card's specific values (Terminal ID, Physical
 *   Location, Hardware Token, Clock Reference) asserted a real active
 *   session state — "YubiKey 5 FIPS (Active)", "NIST NTP Synchronized" —
 *   that doesn't exist. The card stays, same fields, but each shows "Not
 *   tracked yet" instead of a fabricated value.
 * - The 3-stage progress rail, Custody Record preview, and every other
 *   card/section are kept exactly as designed — Stage 1 shown complete and
 *   Stage 2 active is decorative framing for a form that's genuinely one
 *   page, not a real multi-step flow, so it's non-interactive.
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
    const [classification, setClassification] = useState<
        "digital" | "physical"
    >("digital");
    const [sourceOrigin, setSourceOrigin] = useState("");
    const [acquiredAt, setAcquiredAt] = useState("");
    const [custodian, setCustodian] = useState(auth.user.name);
    const [witness, setWitness] = useState("");
    const [warrantRef, setWarrantRef] = useState("");
    const [handlingNotes, setHandlingNotes] = useState("");
    const { notify } = useNotificationDialog();
    const draftKey = `h1-evidence-intake-draft-${caseFile.case_number}`;

    const { data, setData, post, processing, errors, transform } = useForm<{
        physical_source_id: string;
        title: string;
        description: string;
        evidence_type: string;
        file: File | null;
    }>({
        physical_source_id: "",
        title: "",
        description: "",
        evidence_type: evidenceTypes[0] ?? "",
        file: null,
    });

    useEffect(() => {
        const storedDraft = window.localStorage.getItem(draftKey);
        if (!storedDraft) return;

        try {
            const draft = JSON.parse(storedDraft) as Record<string, unknown>;
            setClassification(draft.classification === "physical" ? "physical" : "digital");
            setSourceOrigin(typeof draft.sourceOrigin === "string" ? draft.sourceOrigin : "");
            setAcquiredAt(typeof draft.acquiredAt === "string" ? draft.acquiredAt : "");
            setCustodian(typeof draft.custodian === "string" ? draft.custodian : auth.user.name);
            setWitness(typeof draft.witness === "string" ? draft.witness : "");
            setWarrantRef(typeof draft.warrantRef === "string" ? draft.warrantRef : "");
            setHandlingNotes(typeof draft.handlingNotes === "string" ? draft.handlingNotes : "");
            setData((current) => ({
                ...current,
                physical_source_id: typeof draft.physical_source_id === "string" ? draft.physical_source_id : "",
                title: typeof draft.title === "string" ? draft.title : "",
                evidence_type: typeof draft.evidence_type === "string" ? draft.evidence_type : current.evidence_type,
            }));
        } catch {
            window.localStorage.removeItem(draftKey);
        }
    }, [auth.user.name, draftKey, setData]);

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
            .join("\n");

        transform((formData) => ({
            ...formData,
            description: composedDescription,
        }));

        // forceFormData is required because a File is present — Inertia
        // otherwise defaults to a JSON-encoded request that can't carry it.
        post(EvidenceController.store(caseFile.case_number).url, {
            forceFormData: true,
            onSuccess: () => window.localStorage.removeItem(draftKey),
        });
    };

    const saveDraft = () => {
        window.localStorage.setItem(
            draftKey,
            JSON.stringify({
                classification,
                physical_source_id: data.physical_source_id,
                title: data.title,
                evidence_type: data.evidence_type,
                sourceOrigin,
                acquiredAt,
                custodian,
                witness,
                warrantRef,
                handlingNotes,
            }),
        );
        notify({
            title: "Evidence draft saved",
            message: "The metadata is saved in this browser. Select the evidence file again when you return because files are never retained in browser drafts.",
            tone: "success",
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Register Evidence" />

            <div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
                        <div className="flex max-w-3xl flex-col gap-1">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                                Evidence / Controlled intake
                            </span>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Register evidence
                            </h1>
                            <p className="text-sm text-slate-500">
                                Establish initial custody, hardware/digital
                                provenance, and calculate an immutable
                                cryptographic SHA-256 hash baseline for{" "}
                                <span className="font-medium text-slate-700">
                                    {caseFile.case_number}
                                </span>
                                .
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2 shadow-sm">
                            <span className="material-symbols-outlined text-[22px] text-secondary">
                                lock
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    Storage
                                </span>
                                <span className="text-sm font-semibold text-slate-900">
                                    Secure Vault
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-900 text-sm font-bold text-white">
                                    01
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                                        Stage 1
                                    </span>
                                    <span className="truncate text-sm font-semibold text-slate-900">
                                        Case context
                                    </span>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-[20px] text-emerald-600">
                                    check_circle
                                </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-secondary text-sm font-bold text-white shadow-sm">
                                    02
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                                        Active Ingestion
                                    </span>
                                    <span className="truncate text-sm font-semibold text-slate-900">
                                        File, source &amp; details
                                    </span>
                                </div>
                                <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-secondary" />
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5 opacity-70">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-200 text-sm font-bold text-slate-500">
                                    03
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Final Seal
                                    </span>
                                    <span className="truncate text-sm font-semibold text-slate-500">
                                        Review &amp; register
                                    </span>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-[20px] text-slate-400">
                                    lock_clock
                                </span>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12"
                    >
                        <div className="flex flex-col gap-4 lg:col-span-8">
                            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="app-section-title">
                                        Evidence classification
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                        ISO/IEC 27037:Sec 6.3
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label
                                        className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-all ${
                                            classification === "digital"
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-[18px] text-secondary">
                                                    draft
                                                </span>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    Digital Files
                                                </span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="classification"
                                                checked={
                                                    classification === "digital"
                                                }
                                                onChange={() =>
                                                    setClassification("digital")
                                                }
                                                className="h-4 w-4 text-secondary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Documents, recordings, archives,
                                            exports, and backup files.
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {[
                                                ".E01",
                                                ".PDF",
                                                ".PCAP",
                                                ".RAW",
                                            ].map((ext) => (
                                                <span
                                                    key={ext}
                                                    className="rounded bg-white px-2 py-0.5 text-xs text-slate-500"
                                                >
                                                    {ext}
                                                </span>
                                            ))}
                                        </div>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-all ${
                                            classification === "physical"
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:bg-slate-50"
                                        } ${physicalSources.length === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-[18px] text-secondary">
                                                    hard_drive
                                                </span>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    Physical Storage Devices
                                                </span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="classification"
                                                disabled={
                                                    physicalSources.length === 0
                                                }
                                                checked={
                                                    classification ===
                                                    "physical"
                                                }
                                                onChange={() =>
                                                    setClassification(
                                                        "physical",
                                                    )
                                                }
                                                className="h-4 w-4 text-secondary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {physicalSources.length > 0
                                                ? "Hard drives, USB flash drives, memory cards, and mobile devices already logged on this case."
                                                : "No physical sources are logged on this case yet."}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {[
                                                "Hard Drive",
                                                "USB",
                                                "Mobile Phone",
                                            ].map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded bg-white px-2 py-0.5 text-xs text-slate-500"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </label>
                                </div>

                                {classification === "physical" &&
                                    physicalSources.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-1.5">
                                            <label
                                                htmlFor="physical_source_id"
                                                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                            >
                                                Physical Source
                                            </label>
                                            <select
                                                id="physical_source_id"
                                                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                                value={data.physical_source_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "physical_source_id",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Select a physical source…
                                                </option>
                                                {physicalSources.map(
                                                    (source) => (
                                                        <option
                                                            key={source.id}
                                                            value={source.id}
                                                        >
                                                            {source.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    errors.physical_source_id
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                            </div>

                            <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <h2 className="app-section-title">
                                    File / source
                                </h2>

                                <div className="relative flex flex-col items-center justify-center rounded-xl bg-slate-50 p-5 text-center transition-colors hover:bg-slate-100">
                                    <input
                                        type="file"
                                        required
                                        aria-label="Evidence file"
                                        onChange={(e) =>
                                            setData(
                                                "file",
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-sm">
                                        <span className="material-symbols-outlined text-[28px]">
                                            cloud_upload
                                        </span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                        Drag digital evidence file here or
                                        browse files
                                    </h3>
                                    <p className="max-w-md text-xs text-slate-500">
                                        Upload files up to{" "}
                                        {formatMaxSize(maxUploadSizeKb)}. System
                                        automatically calculates an original
                                        digital fingerprint upon registration.
                                    </p>
                                </div>
                                <InputError message={errors.file} />

                                {data.file && (
                                    <div className="rounded-lg bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-600">
                                                    <span className="material-symbols-outlined text-[22px]">
                                                        description
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-sm font-semibold text-slate-900">
                                                        {data.file.name}
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-500">
                                                        {data.file.type ||
                                                            "unknown type"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="font-mono text-sm font-semibold text-slate-900">
                                                    {formatBytes(
                                                        data.file.size,
                                                    )}
                                                </div>
                                                <div className="font-mono text-xs text-slate-400">
                                                    {data.file.size.toLocaleString()}{" "}
                                                    bytes
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            <span>
                                                Associated Investigative Case
                                                File
                                            </span>
                                            <span className="text-[11px] font-normal normal-case text-slate-400">
                                                Locked to active session
                                            </span>
                                        </label>
                                        <div className="flex h-10 items-center rounded-md border border-border bg-slate-50 px-3 text-sm text-slate-600">
                                            {caseFile.case_number} —{" "}
                                            {caseFile.title}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label
                                            htmlFor="title"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Evidence Title{" "}
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
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="evidence_type"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Evidence Type{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            id="evidence_type"
                                            required
                                            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={data.evidence_type}
                                            onChange={(e) =>
                                                setData(
                                                    "evidence_type",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {evidenceTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.evidence_type}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="source_origin"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Source / Seizure Origin
                                        </label>
                                        <Input
                                            id="source_origin"
                                            value={sourceOrigin}
                                            onChange={(e) =>
                                                setSourceOrigin(e.target.value)
                                            }
                                            placeholder="e.g. CFO workstation, /Volumes/Data/Exports"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="acquired_at"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Timestamp of Acquisition
                                        </label>
                                        <Input
                                            id="acquired_at"
                                            value={acquiredAt}
                                            onChange={(e) =>
                                                setAcquiredAt(e.target.value)
                                            }
                                            placeholder="e.g. 08 Sep 2026, 10:42 EST"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="custodian"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Custodian / Examiner
                                        </label>
                                        <Input
                                            id="custodian"
                                            value={custodian}
                                            onChange={(e) =>
                                                setCustodian(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="witness"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Witness / Assisting Agent
                                        </label>
                                        <Input
                                            id="witness"
                                            value={witness}
                                            onChange={(e) =>
                                                setWitness(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="warrant_ref"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Warrant / Authorization Ref
                                        </label>
                                        <Input
                                            id="warrant_ref"
                                            value={warrantRef}
                                            onChange={(e) =>
                                                setWarrantRef(e.target.value)
                                            }
                                            className="font-mono"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label
                                            htmlFor="handling_notes"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Forensic Handling Notes
                                        </label>
                                        <textarea
                                            id="handling_notes"
                                            rows={3}
                                            className="w-full resize-none rounded-md border border-border bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={handlingNotes}
                                            onChange={(e) =>
                                                setHandlingNotes(e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-white shadow-sm">
                                    <span className="material-symbols-outlined text-[22px]">
                                        lock
                                    </span>
                                </span>
                                <div>
                                    <span className="text-sm font-semibold text-slate-900">
                                        Controlled evidence registration
                                    </span>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                        Once registered, this file is written to
                                        private storage and its SHA-256 baseline
                                        is calculated after the evidence is
                                        stored in the controlled evidence vault.
                                        The baseline is retained for later
                                        comparison.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse items-center justify-between gap-3 pb-2 sm:flex-row">
                                <Button variant="outline" asChild>
                                    <Link href={EvidenceController.index()}>
                                        <span className="material-symbols-outlined text-[18px]">
                                            close
                                        </span>
                                        Cancel &amp; Discard
                                    </Link>
                                </Button>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={saveDraft}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            save
                                        </span>
                                        Save Draft
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.file}
                                        size="lg"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            verified
                                        </span>
                                        {processing
                                            ? "Registering…"
                                            : "Register Evidence"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 lg:col-span-4">
                            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Examiner Attestation
                                    </h3>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                </div>
                                <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                                        <span className="material-symbols-outlined text-[20px]">
                                            badge
                                        </span>
                                    </span>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-slate-900">
                                            {auth.user.name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {auth.user.email}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-xs">
                                    {[
                                        "Terminal ID",
                                        "Physical Location",
                                        "Hardware Token",
                                        "Clock Reference",
                                    ].map((label) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between py-1"
                                        >
                                            <span className="text-slate-500">
                                                {label}
                                            </span>
                                            <span className="font-mono text-slate-300">
                                                Not tracked yet
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        File Verification
                                    </h3>
                                    <span className="text-xs font-semibold text-emerald-600">
                                        READY
                                    </span>
                                </div>
                                <p className="mb-3 text-xs text-slate-500">
                                    Integrity will be calculated and permanently
                                    logged once the file is stored.
                                </p>
                                <div className="rounded-lg bg-slate-50 p-3.5">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <span>Digital Fingerprint</span>
                                        <span className="text-emerald-600">
                                            AUTO
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">
                                        Generated on registration
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px] text-secondary">
                                        account_tree
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Custody Record
                                    </h3>
                                </div>
                                <div className="relative flex flex-col gap-3 pl-6">
                                    <div className="absolute bottom-2 left-2 top-2 w-0.5 bg-slate-100" />
                                    <div className="relative">
                                        <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-secondary" />
                                        <div className="text-sm font-semibold text-slate-900">
                                            Initial Seizure Recorded
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {sourceOrigin ||
                                                "Source not yet entered"}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-secondary" />
                                        <div className="text-sm font-semibold text-slate-900">
                                            Evidence Ingested &amp; Locked
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {auth.user.name} will lock on
                                            registration
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                                    <span>Status: Pending Save</span>
                                    <span className="flex items-center gap-1 text-slate-600">
                                        <span className="material-symbols-outlined text-[14px]">
                                            shield
                                        </span>{" "}
                                        Protected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
