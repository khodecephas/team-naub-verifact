import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import { PendingSyncList } from "@/components/offline/PendingSyncList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

// `useOffline()` (used inside PendingSyncList) must run inside
// AuthenticatedLayout's children — that's where OfflineProvider actually
// lives (see AuthenticatedLayout.tsx).
function PendingSyncContent() {
    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                eyebrow={<>Offline mode / Pending sync</>}
                title="Offline collection queue"
                description="Evidence collected on this device, held locally until synchronized with the H1 server."
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

            <PendingSyncList />

            <p className="text-xs leading-5 text-slate-500">
                Prototype limitation: offline records are stored in this browser&apos;s IndexedDB without
                additional client-side encryption. Treat this device&apos;s local storage as sensitive, and clear
                the browser profile if it is shared or decommissioned.
            </p>
        </div>
    );
}

export default function PendingSync() {
    return (
        <AuthenticatedLayout>
            <Head title="Offline — Pending Sync" />
            <PendingSyncContent />
        </AuthenticatedLayout>
    );
}
