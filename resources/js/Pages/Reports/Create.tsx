import ReportController from "@/actions/App/Http/Controllers/ReportController";
import InputError from "@/Components/InputError";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

interface EvidenceOption {
    id: number;
    evidence_number: string;
    title: string;
    type: string;
    integrity_status: string;
    registered_at: string;
}
interface FindingOption {
    id: number;
    finding_number: string;
    title: string;
    narrative: string;
    authored_by: string;
    occurred_at: string;
}
interface CaseOption {
    id: number;
    case_number: string;
    title: string;
    description: string | null;
    evidence: EvidenceOption[];
    findings: FindingOption[];
}
interface FinalReport {
    id: number;
    report_number: string;
    case_id: number;
    title: string;
}

type StepKey = "case" | "evidence" | "findings" | "details" | "review";

const STEP_LABELS: Record<StepKey, string> = {
    case: "Select case",
    evidence: "Select evidence",
    findings: "Findings",
    details: "Report details",
    review: "Review",
};

const STEP_DESCRIPTIONS: Record<StepKey, string> = {
    case: "Choose the investigation this report will explain.",
    evidence: "Select one or more evidence records from the chosen case.",
    findings: "Optionally include findings already recorded against this case.",
    details: "Provide a clear title and optional introduction.",
    review: "Confirm the information included in the draft.",
};

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export default function Create({
    cases,
    finalReports,
    selectedCaseNumber,
}: {
    cases: CaseOption[];
    finalReports: FinalReport[];
    selectedCaseNumber: string | null;
}) {
    const initialCase = cases.find(
        (item) => item.case_number === selectedCaseNumber,
    );
    const caseLocked = Boolean(initialCase);
    const stepKeys = useMemo<StepKey[]>(
        () =>
            caseLocked
                ? ["evidence", "findings", "details", "review"]
                : ["case", "evidence", "findings", "details", "review"],
        [caseLocked],
    );
    const [step, setStep] = useState(0);
    const currentKey = stepKeys[step];
    const form = useForm({
        case_id: initialCase ? String(initialCase.id) : "",
        evidence_ids: [] as number[],
        finding_ids: [] as number[],
        title: initialCase
            ? `Digital Evidence Integrity Report — ${initialCase.case_number}`
            : "",
        introduction: "",
        supersedes_report_id: "",
    });
    const selectedCase = useMemo(
        () => cases.find((item) => item.id === Number(form.data.case_id)),
        [cases, form.data.case_id],
    );
    const selectedEvidence =
        selectedCase?.evidence.filter((item) =>
            form.data.evidence_ids.includes(item.id),
        ) ?? [];
    const selectedFindings =
        selectedCase?.findings.filter((item) =>
            form.data.finding_ids.includes(item.id),
        ) ?? [];
    const canContinue =
        currentKey === "case"
            ? Boolean(selectedCase)
            : currentKey === "evidence"
              ? selectedEvidence.length > 0
              : currentKey === "details"
                ? form.data.title.trim().length > 0
                : true;

    const chooseCase = (id: string) => {
        const chosen = cases.find((item) => item.id === Number(id));
        form.setData((data) => ({
            ...data,
            case_id: id,
            evidence_ids: [],
            finding_ids: [],
            title: chosen
                ? `Digital Evidence Integrity Report — ${chosen.case_number}`
                : "",
            supersedes_report_id: "",
        }));
    };
    const toggleEvidence = (id: number) =>
        form.setData(
            "evidence_ids",
            form.data.evidence_ids.includes(id)
                ? form.data.evidence_ids.filter((value) => value !== id)
                : [...form.data.evidence_ids, id],
        );
    const toggleFinding = (id: number) =>
        form.setData(
            "finding_ids",
            form.data.finding_ids.includes(id)
                ? form.data.finding_ids.filter((value) => value !== id)
                : [...form.data.finding_ids, id],
        );
    const evidenceColumns: ColumnDef<EvidenceOption, unknown>[] = [
        {
            id: "select",
            header: "Select",
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={form.data.evidence_ids.includes(row.original.id)}
                    onChange={() => toggleEvidence(row.original.id)}
                    aria-label={`Include ${row.original.evidence_number}`}
                    className="h-4 w-4 rounded border-slate-300"
                />
            ),
        },
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div>
                    <p className="font-mono text-xs font-bold text-secondary">
                        {row.original.evidence_number}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <span className="text-xs text-slate-600">
                    {row.original.type.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            accessorKey: "integrity_status",
            header: "Integrity state",
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-slate-600">
                    {row.original.integrity_status.replace(/_/g, " ")}
                </span>
            ),
        },
    ];
    const findingColumns: ColumnDef<FindingOption, unknown>[] = [
        {
            id: "select",
            header: "Include",
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={form.data.finding_ids.includes(row.original.id)}
                    onChange={() => toggleFinding(row.original.id)}
                    aria-label={`Include ${row.original.finding_number}`}
                    className="h-4 w-4 rounded border-slate-300"
                />
            ),
        },
        {
            accessorKey: "finding_number",
            header: "Finding",
            cell: ({ row }) => (
                <div className="max-w-md">
                    <p className="font-mono text-xs font-bold text-secondary">
                        {row.original.finding_number}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{row.original.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {row.original.narrative}
                    </p>
                </div>
            ),
        },
        {
            id: "recorded",
            header: "Recorded",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-700">
                        {dateTime(row.original.occurred_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        by {row.original.authored_by}
                    </p>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Create Report" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link
                                href={ReportController.index()}
                                className="hover:text-slate-900"
                            >
                                Reports
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>Create
                        </>
                    }
                    title="Create non-technical report"
                    description="Choose the records to include, review the plain-language content, then generate a draft."
                />

                {caseLocked && initialCase ? (
                    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                            folder_open
                        </span>
                        Creating a report for{" "}
                        <span className="font-mono font-bold">{initialCase.case_number}</span> —{" "}
                        {initialCase.title}
                    </div>
                ) : null}

                <ol
                    className={`grid gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm ${caseLocked ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}
                >
                    {stepKeys.map((key, index) => (
                        <li
                            key={key}
                            className={`flex items-center gap-2 rounded px-3 py-2.5 ${step === index ? "bg-slate-900 text-white" : index < step ? "bg-blue-50 text-blue-800" : "bg-slate-50 text-slate-500"}`}
                        >
                            <span className="font-mono text-xs font-bold">
                                {index < step
                                    ? "✓"
                                    : String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs font-semibold">
                                {STEP_LABELS[key]}
                            </span>
                        </li>
                    ))}
                </ol>
                <Panel>
                    <PanelHeader
                        title={STEP_LABELS[currentKey]}
                        description={STEP_DESCRIPTIONS[currentKey]}
                    />
                    <div className="p-5 sm:p-6">
                        {currentKey === "case" && (
                            <div className="grid gap-3 md:grid-cols-2">
                                {cases.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            chooseCase(String(item.id))
                                        }
                                        className={`rounded-md border p-4 text-left transition ${form.data.case_id === String(item.id) ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-slate-400"}`}
                                    >
                                        <p className="font-mono text-xs font-bold text-secondary">
                                            {item.case_number}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {item.evidence.length} evidence item
                                            {item.evidence.length === 1
                                                ? ""
                                                : "s"}
                                        </p>
                                    </button>
                                ))}
                                {cases.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No cases are available for report
                                        creation.
                                    </p>
                                )}
                            </div>
                        )}
                        {currentKey === "evidence" && (
                            <DataTable
                                columns={evidenceColumns}
                                data={selectedCase?.evidence ?? []}
                                searchText="Search evidence to include…"
                                searchAccessor={(item) =>
                                    `${item.evidence_number} ${item.title} ${item.type} ${item.integrity_status}`
                                }
                                getRowId={(item) => String(item.id)}
                                emptyMessage="This case has no evidence available for reporting."
                            />
                        )}
                        {currentKey === "findings" && (
                            selectedCase && selectedCase.findings.length > 0 ? (
                                <DataTable
                                    columns={findingColumns}
                                    data={selectedCase.findings}
                                    searchText="Search findings to include…"
                                    searchAccessor={(item) =>
                                        `${item.finding_number} ${item.title} ${item.narrative} ${item.authored_by}`
                                    }
                                    getRowId={(item) => String(item.id)}
                                    emptyMessage="No findings have been recorded for this case."
                                />
                            ) : (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
                                    <span className="material-symbols-outlined text-3xl text-slate-300">
                                        policy
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                        No findings recorded yet
                                    </p>
                                    <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
                                        Record findings from the case&apos;s
                                        Findings &amp; Analysis tab, then
                                        return here to include them. This
                                        report will clearly state that no
                                        findings were included.
                                    </p>
                                </div>
                            )
                        )}
                        {currentKey === "details" && (
                            <div className="grid max-w-3xl gap-5">
                                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                    Report title
                                    <input
                                        value={form.data.title}
                                        onChange={(event) =>
                                            form.setData(
                                                "title",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                    />
                                    <InputError message={form.errors.title} />
                                </label>
                                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                    Optional introduction
                                    <textarea
                                        rows={5}
                                        value={form.data.introduction}
                                        onChange={(event) =>
                                            form.setData(
                                                "introduction",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Add context for the intended reader."
                                        className="rounded-md border-slate-300 text-sm font-normal"
                                    />
                                    <InputError
                                        message={form.errors.introduction}
                                    />
                                </label>
                                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                    Supersedes an earlier final report
                                    (optional)
                                    <select
                                        value={form.data.supersedes_report_id}
                                        onChange={(event) =>
                                            form.setData(
                                                "supersedes_report_id",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                    >
                                        <option value="">
                                            No earlier report
                                        </option>
                                        {finalReports
                                            .filter(
                                                (report) =>
                                                    report.case_id ===
                                                    selectedCase?.id,
                                            )
                                            .map((report) => (
                                                <option
                                                    key={report.id}
                                                    value={report.id}
                                                >
                                                    {report.report_number} —{" "}
                                                    {report.title}
                                                </option>
                                            ))}
                                    </select>
                                </label>
                            </div>
                        )}
                        {currentKey === "review" && (
                            <div className="grid gap-5 lg:grid-cols-2">
                                <Review
                                    label="Case"
                                    value={
                                        selectedCase
                                            ? `${selectedCase.case_number} — ${selectedCase.title}`
                                            : "Not selected"
                                    }
                                />
                                <Review
                                    label="Evidence included"
                                    value={`${selectedEvidence.length} item${selectedEvidence.length === 1 ? "" : "s"}`}
                                />
                                <Review
                                    label="Report title"
                                    value={form.data.title}
                                />
                                <Review
                                    label="Findings"
                                    value={
                                        selectedFindings.length > 0
                                            ? `${selectedFindings.length} item${selectedFindings.length === 1 ? "" : "s"} included`
                                            : "None included"
                                    }
                                />
                                <div className="lg:col-span-2 rounded-md bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                                    This creates a reviewable draft. The report
                                    becomes a frozen historical snapshot only
                                    after an authorised case manager or
                                    administrator finalizes it.
                                </div>
                            </div>
                        )}
                        <InputError
                            message={
                                form.errors.case_id || form.errors.evidence_ids
                            }
                            className="mt-4"
                        />
                    </div>
                    <div className="flex justify-between border-t border-slate-200 px-5 py-4">
                        <Button
                            variant="outline"
                            disabled={step === 0 || form.processing}
                            onClick={() => setStep((value) => value - 1)}
                        >
                            Back
                        </Button>
                        {step < stepKeys.length - 1 ? (
                            <Button
                                disabled={!canContinue}
                                onClick={() => setStep((value) => value + 1)}
                            >
                                Continue
                                <span className="material-symbols-outlined text-[16px]">
                                    arrow_forward
                                </span>
                            </Button>
                        ) : (
                            <Button
                                disabled={form.processing}
                                onClick={() =>
                                    form.post(ReportController.store().url)
                                }
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    description
                                </span>
                                {form.processing
                                    ? "Generating…"
                                    : "Generate draft"}
                            </Button>
                        )}
                    </div>
                </Panel>
            </div>
        </AuthenticatedLayout>
    );
}

function Review({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}
