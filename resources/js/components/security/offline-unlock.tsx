import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * OFFLINE UNLOCK — a locally-remembered identity, never a stored password.
 * Only shown when this exact browser previously completed a real online
 * login and cached that user's reference data (see useOfflineSession).
 */
export function OfflineUnlock({ cachedUserName, onUnlock }: { cachedUserName: string; onUnlock: () => void }) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="rounded border border-amber-800/60 bg-amber-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
                Offline mode
            </p>
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Previously authenticated user</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{cachedUserName}</p>
            </div>
            <Button
                size="lg"
                onClick={onUnlock}
                className="w-64 bg-slate-100 text-slate-950 hover:bg-white"
            >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    lock_open
                </span>
                Unlock Offline Workspace
            </Button>
            <p className="max-w-xs text-center text-xs leading-5 text-slate-500">
                Server connection is unavailable. Offline evidence collection remains available.
            </p>
        </div>
    );
}

/** Shown when this device has never completed an online login — offline access cannot be securely enabled yet. */
export function OfflineAccessUnavailable() {
    const [retrying, setRetrying] = useState(false);

    const retry = () => {
        setRetrying(true);
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-slate-500">
                wifi_off
            </span>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                Internet Connection Required
            </p>
            <p className="max-w-xs text-xs leading-5 text-slate-500">
                VeriFact must verify your account online before offline access can be enabled on this device.
            </p>
            <Button size="lg" variant="outline" onClick={retry} disabled={retrying} className="w-64">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    refresh
                </span>
                {retrying ? "Retrying…" : "Retry Connection"}
            </Button>
        </div>
    );
}
