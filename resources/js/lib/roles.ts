export function formatRole(role: string): string {
    return role
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function initials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}

const ROLE_BADGE_STYLES: Record<string, string> = {
    ADMINISTRATOR: "border-rose-200 bg-rose-50 text-rose-700",
    CASE_MANAGER: "border-blue-200 bg-blue-50 text-blue-700",
    INVESTIGATOR: "border-indigo-200 bg-indigo-50 text-indigo-700",
    EVIDENCE_CUSTODIAN: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FORENSIC_EXAMINER: "border-violet-200 bg-violet-50 text-violet-700",
    ANALYST: "border-amber-200 bg-amber-50 text-amber-700",
    AUDITOR: "border-slate-300 bg-slate-100 text-slate-700",
};

export function roleBadgeClass(role: string): string {
    return ROLE_BADGE_STYLES[role] ?? "border-purple-200 bg-purple-50 text-purple-700";
}

const ROLE_AVATAR_STYLES: Record<string, string> = {
    ADMINISTRATOR: "bg-rose-100 text-rose-700",
    CASE_MANAGER: "bg-blue-100 text-blue-700",
    INVESTIGATOR: "bg-indigo-100 text-indigo-700",
    EVIDENCE_CUSTODIAN: "bg-emerald-100 text-emerald-700",
    FORENSIC_EXAMINER: "bg-violet-100 text-violet-700",
    ANALYST: "bg-amber-100 text-amber-700",
    AUDITOR: "bg-slate-200 text-slate-700",
};

export function roleAvatarClass(role: string): string {
    return ROLE_AVATAR_STYLES[role] ?? "bg-purple-100 text-purple-700";
}

const ROLE_ICONS: Record<string, string> = {
    ADMINISTRATOR: "shield_person",
    CASE_MANAGER: "badge",
    INVESTIGATOR: "search",
    EVIDENCE_CUSTODIAN: "inventory_2",
    FORENSIC_EXAMINER: "biotech",
    ANALYST: "query_stats",
    AUDITOR: "fact_check",
};

export function roleIcon(role: string): string {
    return ROLE_ICONS[role] ?? "verified_user";
}

/** Groups permission names ("evidence.register") by their prefix ("evidence") for display. */
export function groupPermissions(permissions: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const permission of permissions) {
        const [group] = permission.split(".");
        groups[group] ??= [];
        groups[group].push(permission);
    }

    return groups;
}

export function permissionLabel(permission: string): string {
    const [, action] = permission.split(".");

    return (action ?? permission).replace(/[-_]/g, " ");
}
