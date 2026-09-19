import CaseController from "@/actions/App/Http/Controllers/CaseController";
import FindingController from "@/actions/App/Http/Controllers/FindingController";
import InputError from "@/Components/InputError";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

interface EvidenceOption {
    id: number;
    evidence_number: string;
    title: string;
}

interface CreateProps {
    case: { case_number: string; title: string };
    evidence: EvidenceOption[];
    maxUploadSizeKb: number;
}

function formatMaxSize(kb: number): string {
    const mb = kb / 1024;
    return mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

export default function Create({ case: caseFile, evidence, maxUploadSizeKb }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        narrative: string;
        evidence_id: string;
        attachment: File | null;
    }>({
        title: "",
        narrative: "",
        evidence_id: "",
        attachment: null,
    });

    const findingsTabUrl = `${CaseController.show(caseFile.case_number).url}?tab=findings`;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        // forceFormData is required because a File may be present — Inertia
        // otherwise defaults to a JSON-encoded request that can't carry it.
        post(FindingController.store(caseFile.case_number).url, {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Record Finding" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link href={findingsTabUrl} className="hover:text-slate-900">
                                {caseFile.case_number}
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>Record finding
                        </>
                    }
                    title="Record a finding"
                    description="Findings are appended to a hash-chained, tamper-evident ledger for this case. Once recorded, a finding cannot be edited or removed."
                />

                <form onSubmit={submit}>
                    <Panel>
                        <PanelHeader
                            title="Finding details"
                            description="Describe the finding in plain, precise language."
                        />
                        <div className="grid gap-5 p-5 sm:p-6">
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Title
                                <input
                                    value={data.title}
                                    onChange={(event) => setData("title", event.target.value)}
                                    placeholder="Short summary of this finding"
                                    required
                                    className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                />
                                <InputError message={errors.title} />
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Related evidence (optional)
                                <select
                                    value={data.evidence_id}
                                    onChange={(event) => setData("evidence_id", event.target.value)}
                                    className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                >
                                    <option value="">Not specific to one item</option>
                                    {evidence.map((item) => (
                                        <option key={item.evidence_number} value={item.id}>
                                            {item.evidence_number} — {item.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.evidence_id} />
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Narrative
                                <textarea
                                    value={data.narrative}
                                    onChange={(event) => setData("narrative", event.target.value)}
                                    rows={8}
                                    placeholder="Describe the finding and its basis in plain, precise language."
                                    required
                                    className="rounded-md border-slate-300 text-sm font-normal"
                                />
                                <InputError message={errors.narrative} />
                            </label>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-700">
                                    Supporting document (optional)
                                </span>
                                <div className="relative flex flex-col items-center justify-center rounded-xl bg-slate-50 p-5 text-center transition-colors hover:bg-slate-100">
                                    <input
                                        type="file"
                                        aria-label="Finding attachment"
                                        onChange={(event) =>
                                            setData("attachment", event.target.files?.[0] ?? null)
                                        }
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-sm">
                                        <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
                                            cloud_upload
                                        </span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                        Drag a document here or browse files
                                    </h3>
                                    <p className="max-w-md text-xs text-slate-500">
                                        PDF, Word, text, CSV, or image files up to {formatMaxSize(maxUploadSizeKb)}.
                                        The document is stored and fingerprinted alongside the finding.
                                    </p>
                                </div>
                                <InputError message={errors.attachment} />

                                {data.attachment && (
                                    <div className="rounded-lg bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-600">
                                                    <span
                                                        aria-hidden="true"
                                                        className="material-symbols-outlined text-[22px]"
                                                    >
                                                        description
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-sm font-semibold text-slate-900">
                                                        {data.attachment.name}
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-500">
                                                        {data.attachment.type || "unknown type"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right font-mono text-sm font-semibold text-slate-900">
                                                {formatBytes(data.attachment.size)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href={findingsTabUrl}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                                    add_notes
                                </span>
                                {processing ? "Recording…" : "Record finding"}
                            </Button>
                        </div>
                    </Panel>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
