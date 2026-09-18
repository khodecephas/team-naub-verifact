import EvidenceVerificationComparisonController from "@/actions/App/Http/Controllers/EvidenceVerificationComparisonController";
import { PageHeader } from "@/components/layout/PageHeader";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { Button } from "@/components/ui/button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import {
    EvidenceCaseSummary,
    FileVerificationResult,
    VerificationEvidenceOption,
} from "@/types/evidence";
import { Head, useForm } from "@inertiajs/react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

interface VerifyProps {
    cases: EvidenceCaseSummary[];
    evidenceOptions: VerificationEvidenceOption[];
    selectedEvidenceNumber: string | null;
    verificationResult: FileVerificationResult | null;
    maxUploadSizeKb: number;
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function EvidenceSummary({
    evidence,
}: {
    evidence: VerificationEvidenceOption;
}) {
    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-blue-800 shadow-sm">
                    <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[22px]"
                    >
                        inventory_2
                    </span>
                </span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800">
                            {evidence.evidence_number}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500">
                            {evidence.evidence_type
                                .toLowerCase()
                                .replaceAll("_", " ")}
                        </span>
                    </div>
                    <h2 className="mt-1 truncate text-sm font-semibold text-slate-950">
                        {evidence.title}
                    </h2>
                    <p className="mt-1 truncate text-xs text-slate-500">
                        {evidence.original_filename} •{" "}
                        {formatBytes(evidence.file_size_bytes)}
                    </p>
                </div>
            </div>
        </div>
    );
}

function FileDropzone({
    file,
    error,
    maxUploadSizeKb,
    onSelect,
}: {
    file: File | null;
    error?: string;
    maxUploadSizeKb: number;
    onSelect: (file: File | null) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
        onSelect(event.target.files?.[0] ?? null);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        onSelect(event.dataTransfer.files?.[0] ?? null);
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-700 ${
                    dragging
                        ? "border-blue-600 bg-blue-50"
                        : file
                          ? "border-blue-300 bg-blue-50/50"
                          : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    onChange={handleInput}
                    className="sr-only"
                    aria-label="Choose comparison file"
                />
                <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${file ? "bg-blue-800 text-white" : "bg-white text-blue-800"}`}
                >
                    <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[26px]"
                    >
                        {file ? "draft" : "upload_file"}
                    </span>
                </span>
                <strong className="mt-3 max-w-full truncate text-sm text-slate-950">
                    {file?.name ?? "Choose a file to compare"}
                </strong>
                <span className="mt-1 text-xs text-slate-500">
                    {file
                        ? formatBytes(file.size)
                        : "Drag and drop or browse from your device"}
                </span>
                <span className="mt-2 text-[10px] text-slate-400">
                    Maximum file size: {formatBytes(maxUploadSizeKb * 1024)}
                </span>
            </div>
            {error ? (
                <p className="mt-2 text-xs font-medium text-red-700">{error}</p>
            ) : null}
        </>
    );
}

function ResultNotice({ result }: { result: FileVerificationResult }) {
    return (
        <div
            className={`flex items-start gap-4 rounded-md border p-5 ${result.matches ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
            <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${result.matches ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}
            >
                <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[24px]"
                >
                    {result.matches ? "check_circle" : "warning"}
                </span>
            </span>
            <div>
                <h2
                    className={`text-base font-bold ${result.matches ? "text-emerald-950" : "text-red-950"}`}
                >
                    {result.matches
                        ? "The files match"
                        : "The files do not match"}
                </h2>
                <p
                    className={`mt-1 text-sm leading-6 ${result.matches ? "text-emerald-800" : "text-red-800"}`}
                >
                    {result.matches
                        ? "The selected file is unchanged from the registered evidence baseline."
                        : "The selected file differs from the registered evidence baseline. Review the file before using it."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                    Checked {formatDateTime(result.verified_at)}
                </p>
            </div>
        </div>
    );
}

export default function Verify({
    cases,
    evidenceOptions,
    selectedEvidenceNumber,
    verificationResult,
    maxUploadSizeKb,
}: VerifyProps) {
    const initialEvidenceNumber =
        selectedEvidenceNumber ?? evidenceOptions[0]?.evidence_number ?? "";
    const [caseId, setCaseId] = useState("");
    const [evidenceNumber, setEvidenceNumber] = useState(initialEvidenceNumber);
    const [resultDismissed, setResultDismissed] = useState(false);
    const { notify } = useNotificationDialog();
    const form = useForm<{ file: File | null }>({ file: null });

    const visibleEvidence = useMemo(
        () =>
            evidenceOptions.filter(
                (item) => !caseId || String(item.case?.id ?? "") === caseId,
            ),
        [caseId, evidenceOptions],
    );
    const selectedEvidence =
        evidenceOptions.find(
            (item) => item.evidence_number === evidenceNumber,
        ) ?? null;
    const result =
        !resultDismissed &&
        verificationResult?.evidence_number === evidenceNumber
            ? verificationResult
            : null;

    const clearCurrentComparison = () => {
        setResultDismissed(true);
        form.reset();
        form.clearErrors();
    };

    const updateCase = (value: string) => {
        const firstAvailable = evidenceOptions.find(
            (item) => !value || String(item.case?.id ?? "") === value,
        );

        setCaseId(value);
        setEvidenceNumber(firstAvailable?.evidence_number ?? "");
        clearCurrentComparison();
    };

    const updateEvidence = (value: string) => {
        setEvidenceNumber(value);
        clearCurrentComparison();
    };

    const selectComparisonFile = (file: File | null) => {
        if (file && file.size > maxUploadSizeKb * 1024) {
            form.setData("file", null);
            form.setError(
                "file",
                `The selected file exceeds the ${formatBytes(maxUploadSizeKb * 1024)} server upload limit.`,
            );

            return;
        }

        form.setData("file", file);
        form.clearErrors("file");
        setResultDismissed(true);
    };

    const submitComparison = () => {
        if (!selectedEvidence || !form.data.file) {
            return;
        }

        form.post(
            EvidenceVerificationComparisonController.store(
                selectedEvidence.evidence_number,
            ).url,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    const completedResult = page.props
                        .verificationResult as FileVerificationResult | null;

                    setResultDismissed(false);

                    if (completedResult) {
                        notify({
                            title: completedResult.matches
                                ? "Evidence files match"
                                : "Evidence files do not match",
                            message: completedResult.matches
                                ? "The comparison file matches the registered evidence baseline."
                                : "The comparison file is different from the registered evidence baseline.",
                            tone: completedResult.matches
                                ? "success"
                                : "warning",
                            actionLabel: "Done",
                            details: (
                                <div className="rounded-md bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-xs text-slate-500">
                                            Evidence
                                        </span>
                                        <strong className="font-mono text-xs text-slate-900">
                                            {completedResult.evidence_number}
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-xs text-slate-500">
                                            Compared file
                                        </span>
                                        <strong className="max-w-[65%] truncate text-xs text-slate-900">
                                            {
                                                completedResult.comparison_filename
                                            }
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-xs text-slate-500">
                                            File size
                                        </span>
                                        <strong className="text-xs text-slate-900">
                                            {formatBytes(
                                                completedResult.comparison_file_size_bytes,
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            ),
                        });
                    }
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Verify Evidence" />

            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow="Evidence integrity"
                    title="Verify an evidence file"
                    description="Choose a registered evidence item, add the file you want to check, and compare them."
                    actions={
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Secure comparison
                        </span>
                    }
                />

                <section
                    aria-label="Verification steps"
                    className="grid gap-3 sm:grid-cols-3"
                >
                    {[
                        ["1", "Select evidence", "Choose the registered item"],
                        [
                            "2",
                            "Add comparison file",
                            "Select the file to check",
                        ],
                        ["3", "Review result", "See whether the files match"],
                    ].map(([number, title, description]) => (
                        <div
                            key={number}
                            className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                {number}
                            </span>
                            <div>
                                <strong className="block text-sm text-slate-900">
                                    {title}
                                </strong>
                                <span className="text-xs text-slate-500">
                                    {description}
                                </span>
                            </div>
                        </div>
                    ))}
                </section>

                {result ? <ResultNotice result={result} /> : null}

                <section className="grid gap-5 lg:grid-cols-2">
                    <article className="rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-800">
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[20px]"
                                    >
                                        folder_special
                                    </span>
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-950">
                                        Registered evidence
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        This is the protected reference file.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 p-5 gap-6">
                            <label className="flex flex-col gap-1.5">
                                <span className="app-field-label">
                                    Filter by case
                                </span>
                                <select
                                    value={caseId}
                                    onChange={(event) =>
                                        updateCase(event.target.value)
                                    }
                                    className="h-10 text-sm"
                                >
                                    <option value="">
                                        All authorised cases
                                    </option>
                                    {cases.map((caseFile) => (
                                        <option
                                            key={caseFile.id}
                                            value={caseFile.id}
                                        >
                                            {caseFile.case_number} —{" "}
                                            {caseFile.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="app-field-label">
                                    Evidence item
                                </span>
                                <select
                                    value={evidenceNumber}
                                    onChange={(event) =>
                                        updateEvidence(event.target.value)
                                    }
                                    className="h-10 text-sm"
                                    disabled={visibleEvidence.length === 0}
                                >
                                    <option value="">Select evidence</option>
                                    {visibleEvidence.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.evidence_number}
                                        >
                                            {item.evidence_number} —{" "}
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {selectedEvidence ? (
                                <EvidenceSummary evidence={selectedEvidence} />
                            ) : (
                                <div className="rounded-md bg-slate-50 p-8 text-center text-sm text-slate-500">
                                    No evidence is available for this case.
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-violet-800">
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[20px]"
                                    >
                                        upload_file
                                    </span>
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-950">
                                        File to compare
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        This file is checked and then discarded.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <FileDropzone
                                key={
                                    form.data.file
                                        ? `${form.data.file.name}-${form.data.file.size}`
                                        : "empty"
                                }
                                file={form.data.file}
                                error={form.errors.file}
                                maxUploadSizeKb={maxUploadSizeKb}
                                onSelect={selectComparisonFile}
                            />
                        </div>
                    </article>
                </section>

                <div className="flex flex-col items-center justify-between gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                        <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[18px] text-slate-600"
                        >
                            privacy_tip
                        </span>
                        <span>
                            The comparison file is not added to the evidence
                            vault.
                        </span>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearCurrentComparison}
                            disabled={!form.data.file && !result}
                        >
                            Clear
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            onClick={submitComparison}
                            disabled={
                                !selectedEvidence ||
                                !form.data.file ||
                                form.processing
                            }
                            className="flex-1 sm:min-w-48"
                        >
                            <span
                                aria-hidden="true"
                                className={`material-symbols-outlined text-[19px] ${form.processing ? "animate-spin" : ""}`}
                            >
                                {form.processing
                                    ? "progress_activity"
                                    : "verified_user"}
                            </span>
                            {form.processing
                                ? `Checking ${form.progress?.percentage ?? 0}%`
                                : "Verify file"}
                        </Button>
                    </div>
                </div>

                {result ? (
                    <details className="rounded-md border border-slate-200 bg-white shadow-sm">
                        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-700">
                            Technical details
                        </summary>
                        <div className="grid gap-4 border-t border-slate-200 p-5 lg:grid-cols-2">
                            <div>
                                <span className="app-field-label">
                                    Registered baseline
                                </span>
                                <code className="mt-2 block break-all rounded bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
                                    {result.baseline_sha256}
                                </code>
                            </div>
                            <div>
                                <span className="app-field-label">
                                    Compared file
                                </span>
                                <code className="mt-2 block break-all rounded bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
                                    {result.observed_sha256}
                                </code>
                            </div>
                            <p className="text-xs text-slate-500 lg:col-span-2">
                                Verification record #{result.verification_id} •{" "}
                                {formatDateTime(result.verified_at)}
                            </p>
                        </div>
                    </details>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}
