import ApplicationLogo from "@/Components/ApplicationLogo";
import { OfflineAccessUnavailable, OfflineUnlock } from "@/components/security/offline-unlock";
import { WorkspaceLock } from "@/components/security/workspace-lock";
import { Button } from "@/components/ui/button";
import { useOfflineSession } from "@/hooks/use-offline-session";
import { useConnectivity } from "@/offline/useConnectivity";
import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

export interface SecureLandingUser {
    id: number;
    name: string;
    role: string;
}

interface SecureLandingScreenProps {
    /** null for a guest with no authenticated session at all. */
    user: SecureLandingUser | null;
    loginHref: string;
    /** Resume an already-valid server session — never re-collects a password. */
    onUnlockOnline: () => void | Promise<void>;
    /** Resume from the locally-cached identity while offline. */
    onUnlockOffline: () => void;
}

type ConnectivityPhase = "online" | "offline" | "reconnecting";

function ConnectivityLine({ phase }: { phase: ConnectivityPhase }) {
    const copy: Record<ConnectivityPhase, { label: string; dot: string; text: string }> = {
        online: { label: "Connection: Online", dot: "bg-emerald-400", text: "text-emerald-300" },
        offline: { label: "Connection: Offline", dot: "bg-amber-400", text: "text-amber-300" },
        reconnecting: { label: "Connection: Reconnecting…", dot: "bg-blue-400 animate-pulse", text: "text-blue-300" },
    };
    const style = copy[phase];

    return (
        <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${style.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </p>
    );
}

/**
 * The full-screen secure landing / lock screen. Used two ways:
 *  - as the guest entry point (`user` is null) at `/`;
 *  - as the in-app workspace lock overlay (`user` present) inside
 *    AuthenticatedLayout, which renders this INSTEAD of the app's content
 *    while locked — nothing behind it is ever left in the DOM.
 */
export function SecureLandingScreen({ user, loginHref, onUnlockOnline, onUnlockOffline }: SecureLandingScreenProps) {
    const isOnline = useConnectivity();
    const { checked, hasPriorSession, cachedUserName } = useOfflineSession(user?.id ?? null);
    const [phase, setPhase] = useState<ConnectivityPhase>(isOnline ? "online" : "offline");
    const wasOnline = useRef(isOnline);

    useEffect(() => {
        if (isOnline && !wasOnline.current) {
            setPhase("reconnecting");
            const timer = window.setTimeout(() => setPhase("online"), 1200);
            wasOnline.current = true;

            return () => window.clearTimeout(timer);
        }

        wasOnline.current = isOnline;
        setPhase(isOnline ? "online" : "offline");
    }, [isOnline]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a1220] px-4 text-slate-100">
            <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
                <div>
                    <p className="text-2xl font-bold tracking-[0.35em] text-white">VERIFACT</p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                        Digital Evidence Integrity System
                    </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80">
                    <ApplicationLogo className="h-8 w-8 text-slate-300" />
                </div>

                {!checked ? (
                    <div className="h-10" aria-hidden="true" />
                ) : isOnline ? (
                    user ? (
                        <>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Secure Workspace
                            </p>
                            <WorkspaceLock userName={user.name} userRole={user.role} onUnlock={onUnlockOnline} />
                        </>
                    ) : (
                        <>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Secure Workspace
                            </p>
                            <div className="flex flex-col items-center gap-3">
                                <Button size="lg" asChild className="w-64 bg-slate-100 text-slate-950 hover:bg-white">
                                    <Link href={loginHref}>
                                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                            lock
                                        </span>
                                        Sign In to VeriFact
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )
                ) : hasPriorSession && cachedUserName ? (
                    <OfflineUnlock cachedUserName={cachedUserName} onUnlock={onUnlockOffline} />
                ) : (
                    <OfflineAccessUnavailable />
                )}

                <ConnectivityLine phase={phase} />
            </div>

            <p className="absolute bottom-6 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">
                Evidence Integrity • Chain of Custody • Accountability
            </p>
        </div>
    );
}
