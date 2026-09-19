import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import { OfflineModeBanner } from "@/components/offline/OfflineModeBanner";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import { useOffline } from "@/offline/OfflineProvider";
import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useMemo, useState } from "react";

const NEW_PHYSICAL_SOURCE = "__new__";

export default function Collect() {
    const { bootstrap, saveEvidenceOffline, savePhysicalSourceOffline } = useOffline();
    const { notify } = useNotificationDialog();

    const [caseId, setCaseId] = useState("");
    const [physicalSourceChoice, setPhysicalSourceChoice] = useState("");
    const [newSourceLabel, setNewSourceLabel] = useState("");
    const [newSourceType, setNewSourceType] = useState("");
    const [evidenceType, setEvidenceType] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const selectedCase = useMemo(
        () => bootstrap?.cases.find((item) => String(item.id) === caseId) ?? null,
        [bootstrap, caseId],
    );

    const canSubmit =
        Boolean(selectedCase) &&
        Boolean(evidenceType) &&
        title.trim().length > 0 &&
        file !== null &&
        (physicalSourceChoice !== NEW_PHYSICAL_SOURCE || newSourceLabel.trim().length > 0);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedCase || !file) {
            return;
        }

        setSaving(true);

        try {
            let physicalSourceId: number | null = null;
            let physicalSourceOfflineId: string | null = null;

            if (physicalSourceChoice === NEW_PHYSICAL_SOURCE) {
                const source = await savePhysicalSourceOffline({
                    caseId: selectedCase.id,
                    caseNumber: selectedCase.case_number,
                    label: newSourceLabel.trim(),
                    sourceType: newSourceType || (bootstrap?.physicalSourceTypes[0] ?? "OTHER"),
                    description: null,
                    collectionLocation: null,
                });
                physicalSourceOfflineId = source.localId;
            } else if (physicalSourceChoice) {
                physicalSourceId = Number(physicalSourceChoice);
            }

            const record = await saveEvidenceOffline({
                caseId: selectedCase.id,
                caseNumber: selectedCase.case_number,
                physicalSourceId,
                physicalSourceOfflineId,
                evidenceType,
                title: title.trim(),
                description: description.trim() || null,
                file,
            });

            notify({
                title: "Saved offline",
                message: `Stored locally as OFFLINE-${record.localId.slice(0, 8)} with SHA-256 ${record.localSha256.slice(0, 16)}…. It will keep this ID until synchronized.`,
                tone: "success",
            });

            router.visit(OfflineController.index().url);
        } finally {
            setSaving(false);
        }
    };

    if (!bootstrap) {
        return (
            <AuthenticatedLayout>
                <Head title="Collect Evidence Offline" />
                <div className="flex flex-col gap-4">
                    <OfflineModeBanner />
                    <Panel>
                        <div className="p-6 text-sm text-slate-600">
                            No assigned-case reference data is cached on this device yet. Connect once while online so
                            this form can load your assigned cases, then it will keep working offline.
                        </div>
                    </Panel>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Collect Evidence Offline" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link href={OfflineController.index()} className="hover:text-slate-900">
                                Offline mode
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>Collect evidence
                        </>
                    }
                    title="Collect evidence offline"
                    description="Saved to this device's local storage immediately, hashed on this device, and queued for synchronization."
                />

                <OfflineModeBanner />

                <form onSubmit={(event) => void submit(event)}>
                    <Panel>
                        <PanelHeader title="Evidence details" description="Cached assigned-case data only — no master evidence is cached here." />
                        <div className="grid gap-5 p-5 sm:p-6">
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Case
                                <select
                                    value={caseId}
                                    onChange={(event) => {
                                        setCaseId(event.target.value);
                                        setPhysicalSourceChoice("");
                                    }}
                                    required
                                    className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                >
                                    <option value="">Select an assigned case</option>
                                    {bootstrap.cases.map((item) => (
                                        <option key={item.case_number} value={item.id}>
                                            {item.case_number} — {item.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedCase ? (
                                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                    Physical source (optional)
                                    <select
                                        value={physicalSourceChoice}
                                        onChange={(event) => setPhysicalSourceChoice(event.target.value)}
                                        className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                    >
                                        <option value="">Not specific to one item</option>
                                        {selectedCase.physical_sources.map((source) => (
                                            <option key={source.id} value={source.id}>
                                                {source.label}
                                            </option>
                                        ))}
                                        <option value={NEW_PHYSICAL_SOURCE}>Register a new physical source…</option>
                                    </select>
                                </label>
                            ) : null}

                            {physicalSourceChoice === NEW_PHYSICAL_SOURCE ? (
                                <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                                    <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                        New source label
                                        <input
                                            value={newSourceLabel}
                                            onChange={(event) => setNewSourceLabel(event.target.value)}
                                            placeholder="e.g. Seized phone — front pocket"
                                            className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                        />
                                    </label>
                                    <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                        Source type
                                        <select
                                            value={newSourceType}
                                            onChange={(event) => setNewSourceType(event.target.value)}
                                            className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                        >
                                            {bootstrap.physicalSourceTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type.replace(/_/g, " ")}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="text-[11px] text-slate-500 sm:col-span-2">
                                        This physical source will sync first and receive its official ID before its
                                        dependent evidence is uploaded.
                                    </p>
                                </div>
                            ) : null}

                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Evidence type
                                <select
                                    value={evidenceType}
                                    onChange={(event) => setEvidenceType(event.target.value)}
                                    required
                                    className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                >
                                    <option value="">Select a type</option>
                                    {bootstrap.evidenceTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type.replace(/_/g, " ")}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Title
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    required
                                    className="h-10 rounded-md border-slate-300 text-sm font-normal"
                                />
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Description (optional)
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={3}
                                    className="rounded-md border-slate-300 text-sm font-normal"
                                />
                            </label>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-700">Evidence file</span>
                                <div className="relative flex flex-col items-center justify-center rounded-xl bg-slate-50 p-5 text-center transition-colors hover:bg-slate-100">
                                    <input
                                        type="file"
                                        required
                                        aria-label="Evidence file"
                                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-sm">
                                        <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
                                            add_a_photo
                                        </span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                        Capture or choose a file
                                    </h3>
                                    <p className="max-w-md text-xs text-slate-500">
                                        Hashed on this device with SHA-256 the moment you save. The master file is
                                        never sent anywhere until you Sync Now.
                                    </p>
                                </div>
                                {file ? (
                                    <div className="rounded-lg bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {file.name}
                                                </p>
                                                <p className="font-mono text-xs text-slate-500">
                                                    {file.type || "unknown type"}
                                                </p>
                                            </div>
                                            <div className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                                                {formatBytes(file.size)}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href={OfflineController.index()}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={!canSubmit || saving}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                                    save
                                </span>
                                {saving ? "Hashing & saving…" : "Save offline"}
                            </Button>
                        </div>
                    </Panel>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
