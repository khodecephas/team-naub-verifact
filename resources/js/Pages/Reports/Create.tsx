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
interface CaseOption {
    id: number;
    case_number: string;
    title: string;
    description: string | null;
    evidence: EvidenceOption[];
}
interface FinalReport {
    id: number;
    report_number: string;
    case_id: number;
    title: string;
}
const steps = [
    "Select case",
    "Select evidence",
    "Findings",
    "Report details",
    "Review",
];

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
    const [step, setStep] = useState(0);
    const form = useForm({
        case_id: initialCase ? String(initialCase.id) : "",
        evidence_ids: [] as number[],
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
    const canContinue =
        step === 0
            ? Boolean(selectedCase)
            : step === 1
              ? selectedEvidence.length > 0
              : step === 3
                ? form.data.title.trim().length > 0
                : true;

    const chooseCase = (id: string) => {
        const chosen = cases.find((item) => item.id === Number(id));
        form.setData((data) => ({
            ...data,
            case_id: id,
            evidence_ids: [],
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
                <ol className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-5">
                    {steps.map((label, index) => (
                        <li
                            key={label}
                            className={`flex items-center gap-2 rounded px-3 py-2.5 ${step === index ? "bg-slate-900 text-white" : index < step ? "bg-blue-50 text-blue-800" : "bg-slate-50 text-slate-500"}`}
                        >
                            <span className="font-mono text-xs font-bold">
                                {index < step
                                    ? "✓"
                                    : String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs font-semibold">
                                {label}
                            </span>
                        </li>
                    ))}
                </ol>
                <Panel>
                    <PanelHeader
                        title={steps[step]}
                        description={
                            step === 0
                                ? "Choose the investigation this report will explain."
                                : step === 1
                                  ? "Select one or more evidence records from the chosen case."
                                  : step === 2
                                    ? "Findings can be included when the findings module becomes available."
                                    : step === 3
                                      ? "Provide a clear title and optional introduction."
                                      : "Confirm the information included in the draft."
                        }
                    />
                    <div className="p-5 sm:p-6">
                        {step === 0 && (
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
                        {step === 1 && (
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
                        {step === 2 && (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300">
                                    fact_check
                                </span>
                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                    Findings are not available yet
                                </p>
                                <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
                                    The findings module has not been
                                    implemented, so this report will clearly
                                    state that no findings were included.
                                </p>
                            </div>
                        )}
                        {step === 3 && (
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
                        {step === 4 && (
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
                                    value="Not included — module unavailable"
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
                        {step < 4 ? (
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
