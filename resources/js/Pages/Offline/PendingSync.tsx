import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import { OfflineModeBanner } from "@/components/offline/OfflineModeBanner";
import { PendingSyncList } from "@/components/offline/PendingSyncList";
import { SyncStatusBadge } from "@/components/offline/SyncStatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useOffline } from "@/offline/OfflineProvider";
import { Head, Link } from "@inertiajs/react";

export default function PendingSync() {
    const { isOnline, physicalSourceQueue } = useOffline();
    const pendingSources = physicalSourceQueue.filter((item) => item.status !== "SYNCED");

    return (
        <AuthenticatedLayout>
            <Head title="Offline — Pending Sync" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={<>Offline mode / Pending sync</>}
                    title="Offline collection queue"
                    description="Evidence and physical sources collected on this device, held locally until synchronized with the H1 server."
                    actions={
                        <Button asChild>
                            <Link href={OfflineController.collect()}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                    add_a_photo
                                </span>
                                Collect evidence offline
                            </Link>
                        </Button>
                    }
                />

                {!isOnline ? <OfflineModeBanner /> : null}

                {pendingSources.length > 0 ? (
                    <Panel>
                        <PanelHeader
                            title="Pending physical sources"
                            description="Synced before their dependent evidence, in the order shown here"
                        />
                        <ul className="flex flex-col divide-y divide-slate-100 px-5">
                            {pendingSources.map((source) => (
                                <li key={source.localId} className="flex items-center justify-between gap-3 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{source.label}</p>
                                        <p className="text-xs text-slate-500">
                                            {source.caseNumber} · {source.sourceType.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                    <SyncStatusBadge status={source.status} />
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ) : null}

                <PendingSyncList />

                <p className="text-xs leading-5 text-slate-500">
                    Prototype limitation: offline records are stored in this browser&apos;s IndexedDB without
                    additional client-side encryption. Treat this device&apos;s local storage as sensitive, and clear
                    the browser profile if it is shared or decommissioned.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
