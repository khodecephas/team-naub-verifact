import { Button } from "@/components/ui/button";
import { useState } from "react";

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function formatRole(role: string): string {
    return role
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * ONLINE RESUME — the server session (Laravel cookie) already proves
 * identity, so this deliberately never re-asks for a password. Unlocking
 * is a single confirmation, not a login form.
 */
export function WorkspaceLock({
    userName,
    userRole,
    onUnlock,
}: {
    userName: string;
    userRole: string;
    onUnlock: () => void | Promise<void>;
}) {
    const [unlocking, setUnlocking] = useState(false);

    const handleUnlock = async () => {
        setUnlocking(true);
        try {
            await onUnlock();
        } finally {
            setUnlocking(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-lg font-bold tracking-wide text-slate-100">
                {initialsOf(userName)}
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-slate-100">{userName}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{formatRole(userRole)}</p>
            </div>
            <Button
                size="lg"
                onClick={() => void handleUnlock()}
                disabled={unlocking}
                className="w-64 bg-slate-100 text-slate-950 hover:bg-white"
            >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    lock_open
                </span>
                {unlocking ? "Unlocking…" : "Unlock Workspace"}
            </Button>
        </div>
    );
}
