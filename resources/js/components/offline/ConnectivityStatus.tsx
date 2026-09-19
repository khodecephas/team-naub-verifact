import { useOffline } from "@/offline/OfflineProvider";

/** Small header pill reflecting real browser connectivity (`navigator.onLine`), not a decorative placeholder. */
export function ConnectivityStatus() {
    const { isOnline } = useOffline();

    return (
        <span
            className={`hidden items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold md:flex ${
                isOnline
                    ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-300"
                    : "border-amber-800/70 bg-amber-950/40 text-amber-300"
            }`}
            title={isOnline ? "Connected to the H1 server" : "No connection — working offline"}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
            {isOnline ? "Connected" : "Offline"}
        </span>
    );
}
