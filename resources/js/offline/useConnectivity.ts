import { useEffect, useState } from "react";

/**
 * Plain `navigator.onLine` tracking with no other dependencies — usable
 * from the guest landing screen (no authenticated session, so no
 * OfflineProvider is mounted) as well as from inside the authenticated app.
 */
export function useConnectivity(): boolean {
    const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
