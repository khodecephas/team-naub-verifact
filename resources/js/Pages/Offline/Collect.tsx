import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import { useOffline } from "@/offline/OfflineProvider";
import { Head, Link, router } from "@inertiajs/react";
import { DragEvent, FormEvent, useRef, useState } from "react";

/**
 * Mirrors Evidence/QuickIngest.tsx on purpose: an officer under pressure
 * should be able to secure a file in one tap, with no case, physical
 * source, or evidence-type decision to make first (and no risk of a case
 * created after this device last had connectivity being unselectable).
 * Case assignment and full details are completed afterward, online, from
 * the resulting evidence record — exactly like Quick Ingest.
 *
 * `useOffline()` must run inside AuthenticatedLayout's children — that's
 * where OfflineProvider actually lives (see AuthenticatedLayout.tsx) — so
 * this form is a child component, not logic in the page's own body.
 */
function CollectContent() {
    const { saveEvidenceOffline } = useOffline();
    const { notify } = useNotificationDialog();
    const fileInput = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const dropFile = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        setFile(event.dataTransfer.files?.[0] ?? null);
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!file) {
            return;
        }

        setSaving(true);

        try {
            const record = await saveEvidenceOffline({
                description: description.trim() || null,
                file,
            });

            notify({
                title: "Secured on this device",
                message: `Stored locally as OFFLINE-${record.localId.slice(0, 8)} with SHA-256 ${record.localSha256.slice(0, 16)}…. Sync it once you're back online, then complete its case assignment and details.`,
                tone: "success",
            });

            router.visit(OfflineController.index().url);
        } finally {
            setSaving(false);
        }
    };

    return (
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
                description="Secure a file immediately. Case assignment and descriptive details can be completed after it syncs."
            />

            <div className="mx-auto grid w-full gap-5 lg:grid-cols-12">
                <Panel className="lg:col-span-8">
                    <PanelHeader
                        title="Evidence media"
                        description="Select one original file — hashed and stored on this device right away"
                    />
                    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5 p-5 sm:p-6">
                        <div
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={() => setDragging(false)}
                            onDrop={dropFile}
                            className={`flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                                dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"
                            }`}
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                                <span aria-hidden="true" className="material-symbols-outlined text-3xl">
                                    add_a_photo
                                </span>
                            </span>

                            {file ? (
                                <div>
                                    <p className="break-all text-base font-bold text-slate-900">{file.name}</p>
                                    <p className="pt-1 text-sm text-slate-500">
                                        {formatBytes(file.size)} · {file.type || "Unknown media type"}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-base font-bold text-slate-900">
                                        Drop the evidence file here
                                    </p>
                                    <p className="pt-1 text-sm text-slate-500">
                                        or capture / choose a file from this device
                                    </p>
                                </div>
                            )}

                            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                                {file ? "Choose another file" : "Browse files"}
                            </Button>
                            <input
                                ref={fileInput}
                                type="file"
                                className="sr-only"
                                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                            />
                            <p className="text-xs text-slate-400">
                                Hashed with SHA-256 on this device the moment you save it. Nothing is sent anywhere
                                until you Sync Now.
                            </p>
                        </div>

                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            Field notes (optional)
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={3}
                                placeholder="Anything worth capturing in the moment — refined later along with the case assignment."
                                className="rounded-md border-slate-300 text-sm font-normal"
                            />
                        </label>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button variant="ghost" asChild>
                                <Link href={OfflineController.index()}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={!file || saving}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                    enhanced_encryption
                                </span>
                                {saving ? "Securing…" : "Secure evidence"}
                            </Button>
                        </div>
                    </form>
                </Panel>

                <aside className="flex flex-col gap-5 lg:col-span-4">
                    <Panel>
                        <PanelHeader title="What happens next" />
                        <ol className="flex flex-col gap-4 p-5">
                            {[
                                ["1", "Hash on this device", "SHA-256 is calculated locally, offline."],
                                ["2", "Save to local storage", "Kept in this browser's IndexedDB as OFFLINE-xxxx."],
                                [
                                    "3",
                                    "Sync when connected",
                                    "The server independently re-hashes the file and compares it before registering anything.",
                                ],
                                [
                                    "4",
                                    "Complete the record",
                                    "Assign it to a case and enter its classification and source from the evidence page.",
                                ],
                            ].map(([number, title, desc]) => (
                                <li key={number} className="flex gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-bold text-white">
                                        {number}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                                        <p className="pt-0.5 text-xs leading-5 text-slate-500">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Panel>

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                        <div className="flex gap-3">
                            <span aria-hidden="true" className="material-symbols-outlined text-amber-700">
                                assignment_late
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-amber-900">No case needed right now</p>
                                <p className="pt-1 text-xs leading-5 text-amber-800">
                                    The filename becomes the working title. You never have to wait for a case list to
                                    load, or worry that a case created after your last sync won&apos;t show up —
                                    assignment happens once you&apos;re back online.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function Collect() {
    return (
        <AuthenticatedLayout>
            <Head title="Collect Evidence Offline" />
            <CollectContent />
        </AuthenticatedLayout>
    );
}
