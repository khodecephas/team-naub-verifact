import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import InputError from "@/Components/InputError";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import { DragEvent, FormEvent, useRef, useState } from "react";

export default function QuickIngest({
    maxUploadSizeKb,
}: {
    maxUploadSizeKb: number;
}) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const { data, setData, post, processing, progress, errors } = useForm<{
        file: File | null;
    }>({
        file: null,
    });

    const selectFile = (file: File | null) => {
        setData("file", file);
    };

    const dropFile = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        selectFile(event.dataTransfer.files?.[0] ?? null);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(EvidenceController.quickStore().url, {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Quick Evidence Ingest" />

            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link
                                href={EvidenceController.index()}
                                className="hover:text-slate-900"
                            >
                                Evidence
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>
                            Quick ingest
                        </>
                    }
                    title="Quick evidence ingest"
                    description="Secure a digital file immediately. Case assignment and descriptive details can be completed afterward."
                />

                <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-12">
                    <Panel className="lg:col-span-8">
                        <PanelHeader
                            title="Evidence media"
                            description="Select one original file for controlled intake"
                        />
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-5 p-5 sm:p-6"
                        >
                            <div
                                onDragEnter={(event) => {
                                    event.preventDefault();
                                    setDragging(true);
                                }}
                                onDragOver={(event) => event.preventDefault()}
                                onDragLeave={() => setDragging(false)}
                                onDrop={dropFile}
                                className={`flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                                    dragging
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-slate-300 bg-slate-50"
                                }`}
                            >
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-3xl"
                                    >
                                        upload_file
                                    </span>
                                </span>

                                {data.file ? (
                                    <div>
                                        <p className="break-all text-base font-bold text-slate-900">
                                            {data.file.name}
                                        </p>
                                        <p className="pt-1 text-sm text-slate-500">
                                            {formatBytes(data.file.size)} ·{" "}
                                            {data.file.type ||
                                                "Unknown media type"}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-base font-bold text-slate-900">
                                            Drop the original evidence file here
                                        </p>
                                        <p className="pt-1 text-sm text-slate-500">
                                            or choose a file from this
                                            workstation
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInput.current?.click()}
                                >
                                    {data.file
                                        ? "Choose another file"
                                        : "Browse files"}
                                </Button>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    className="sr-only"
                                    onChange={(event) =>
                                        selectFile(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <p className="text-xs text-slate-400">
                                    Maximum file size{" "}
                                    {formatBytes(maxUploadSizeKb * 1024)}
                                </p>
                            </div>

                            <InputError message={errors.file} />

                            {progress ? (
                                <div className="flex flex-col gap-2">
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full bg-blue-700 transition-[width]"
                                            style={{
                                                width: `${progress.percentage}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Securing evidence… {progress.percentage}
                                        %
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button variant="ghost" asChild>
                                    <Link href={EvidenceController.index()}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!data.file || processing}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[18px]"
                                    >
                                        enhanced_encryption
                                    </span>
                                    {processing
                                        ? "Securing evidence…"
                                        : "Secure evidence media"}
                                </Button>
                            </div>
                        </form>
                    </Panel>

                    <aside className="flex flex-col gap-5 lg:col-span-4">
                        <Panel>
                            <PanelHeader title="Automatic integrity validation" />
                            <ol className="flex flex-col gap-4 p-5">
                                {[
                                    [
                                        "1",
                                        "Hash original input",
                                        "SHA-256 is calculated before master storage.",
                                    ],
                                    [
                                        "2",
                                        "Secure master copy",
                                        "The file is written to private controlled storage.",
                                    ],
                                    [
                                        "3",
                                        "Validate stored master",
                                        "The stored copy is hashed and compared byte-for-byte.",
                                    ],
                                    [
                                        "4",
                                        "Create intake record",
                                        "A verified, unassigned record is created for later completion.",
                                    ],
                                ].map(([number, title, description]) => (
                                    <li key={number} className="flex gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-bold text-white">
                                            {number}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {title}
                                            </p>
                                            <p className="pt-0.5 text-xs leading-5 text-slate-500">
                                                {description}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </Panel>

                        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                            <div className="flex gap-3">
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-amber-700"
                                >
                                    assignment_late
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">
                                        Intake completion required
                                    </p>
                                    <p className="pt-1 text-xs leading-5 text-amber-800">
                                        The filename becomes the permanent
                                        evidence title. Assign the record to a
                                        case and enter its classification,
                                        source, and notes from the evidence
                                        page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
