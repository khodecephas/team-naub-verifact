import { getBootstrapCache } from "@/offline/db";
import { useEffect, useState } from "react";

/**
 * OFFLINE UNLOCK — whether *this device* has ever successfully
 * authenticated online and cached that user's identity, independent of
 * whether the current network is up. Backed by the same bootstrap cache
 * the offline-collection queue uses (IndexedDB), never a stored password.
 */
interface OfflineSessionState {
    checked: boolean;
    hasPriorSession: boolean;
    cachedUserName: string | null;
}

export function useOfflineSession(userId: number | null): OfflineSessionState {
    const [state, setState] = useState<OfflineSessionState>({
        checked: false,
        hasPriorSession: false,
        cachedUserName: null,
    });

    useEffect(() => {
        let cancelled = false;

        if (userId === null) {
            setState({ checked: true, hasPriorSession: false, cachedUserName: null });

            return;
        }

        getBootstrapCache(userId)
            .then((cache) => {
                if (cancelled) return;
                setState({
                    checked: true,
                    hasPriorSession: Boolean(cache),
                    cachedUserName: cache?.user.name ?? null,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setState({ checked: true, hasPriorSession: false, cachedUserName: null });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return state;
}
