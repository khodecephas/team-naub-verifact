import { useOffline } from "@/offline/OfflineProvider";

/** Shown app-wide whenever the browser has no connection. */
export function OfflineModeBanner() {
    const { isOnline, pendingCount } = useOffline();

    if (isOnline) {
        return null;
    }

    return (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-900 sm:px-6">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        cloud_off
                    </span>
                    Offline mode
                </p>
                <p className="text-xs">
                    You can continue collecting evidence. Records will remain on this device until synchronized.
                    {pendingCount > 0
                        ? ` ${pendingCount} record${pendingCount === 1 ? "" : "s"} waiting to sync.`
                        : ""}
                </p>
            </div>
        </div>
    );
}
