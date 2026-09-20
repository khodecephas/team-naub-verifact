import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WORKSPACE LOCK — purely a client-side UI concept, deliberately separate
 * from Laravel authentication. Locking never touches the server session;
 * it only hides the application behind the secure landing screen until the
 * same browser tab unlocks it again. Stored in sessionStorage (not
 * localStorage/IndexedDB — this is transient UI state, not evidence data),
 * so it persists across a reload but clears when the tab actually closes.
 */
const LOCK_KEY = "h1-workspace-locked";
const DEFAULT_INACTIVITY_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

function readLocked(): boolean {
    try {
        return sessionStorage.getItem(LOCK_KEY) === "true";
    } catch {
        return false;
    }
}

function writeLocked(value: boolean): void {
    try {
        if (value) {
            sessionStorage.setItem(LOCK_KEY, "true");
        } else {
            sessionStorage.removeItem(LOCK_KEY);
        }
    } catch {
        // Storage unavailable (e.g. some private-browsing modes) — the lock
        // just won't persist across a reload. Fails open to "ask again",
        // never silently to "always unlocked".
    }
}

interface UseWorkspaceLockOptions {
    /** Auto-lock after this many milliseconds of no interaction. 0 disables it. */
    inactivityMs?: number;
    /** Only run the inactivity timer while this is true (e.g. never on the guest landing screen). */
    enabled?: boolean;
}

export function useWorkspaceLock({ inactivityMs = DEFAULT_INACTIVITY_MS, enabled = true }: UseWorkspaceLockOptions = {}) {
    const [locked, setLocked] = useState(readLocked);
    const timerRef = useRef<number | null>(null);

    const lock = useCallback(() => {
        writeLocked(true);
        setLocked(true);
    }, []);

    const unlock = useCallback(() => {
        writeLocked(false);
        setLocked(false);
    }, []);

    useEffect(() => {
        if (!enabled || locked || inactivityMs <= 0) {
            return;
        }

        const resetTimer = () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
            timerRef.current = window.setTimeout(lock, inactivityMs);
        };

        ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
        resetTimer();

        return () => {
            ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [enabled, inactivityMs, lock, locked]);

    return { locked, lock, unlock };
}
