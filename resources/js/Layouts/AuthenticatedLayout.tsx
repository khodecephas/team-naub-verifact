import AuthenticatedSessionController from "@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController";
import AuditController from "@/actions/App/Http/Controllers/AuditController";
import CaseController from "@/actions/App/Http/Controllers/CaseController";
import DashboardController from "@/actions/App/Http/Controllers/DashboardController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import EvidenceVerificationComparisonController from "@/actions/App/Http/Controllers/EvidenceVerificationComparisonController";
import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import ProfileController from "@/actions/App/Http/Controllers/ProfileController";
import ReportController from "@/actions/App/Http/Controllers/ReportController";
import RoleController from "@/actions/App/Http/Controllers/RoleController";
import SearchController from "@/actions/App/Http/Controllers/SearchController";
import UserController from "@/actions/App/Http/Controllers/UserController";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import { ConnectivityStatus } from "@/components/offline/ConnectivityStatus";
import { OfflineModeBanner } from "@/components/offline/OfflineModeBanner";
import { FlashNotificationDialog } from "@/components/notifications/FlashNotificationDialog";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { SecureLandingScreen } from "@/components/security/secure-landing-screen";
import { useWorkspaceLock } from "@/hooks/use-workspace-lock";
import { OfflineProvider, useOffline } from "@/offline/OfflineProvider";
import { PageProps } from "@/types";
import { Link, router, usePage } from "@inertiajs/react";
import { FormEvent, PropsWithChildren, ReactNode, useState } from "react";

interface NavigationItem {
    label: string;
    href?: string;
    icon: string;
}

const baseNavigationItems: NavigationItem[] = [
    {
        label: "Dashboard",
        href: DashboardController.index().url,
        icon: "space_dashboard",
    },
    { label: "Cases", href: CaseController.index().url, icon: "folder_open" },
    {
        label: "Evidence",
        href: EvidenceController.index().url,
        icon: "inventory_2",
    },
    {
        label: "Verify",
        href: EvidenceVerificationComparisonController.index().url,
        icon: "fact_check",
    },
    {
        label: "Reports",
        href: ReportController.index().url,
        icon: "description",
    },
    {
        label: "Offline",
        href: OfflineController.index().url,
        icon: "cloud_off",
    },
    {
        label: "Audit",
        href: AuditController.index().url,
        icon: "history",
    },
];

function formatRole(role: string): string {
    return role
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function Navigation({
    items,
    currentPath,
    mobile = false,
}: {
    items: NavigationItem[];
    currentPath: string;
    mobile?: boolean;
}) {
    return (
        <nav
            aria-label={mobile ? "Mobile navigation" : "Main navigation"}
            className={
                mobile
                    ? "grid gap-1 p-3"
                    : "hidden h-full items-stretch lg:flex"
            }
        >
            {items.map((item) => {
                const isActive = item.href
                    ? currentPath === item.href ||
                      currentPath.startsWith(`${item.href}/`)
                    : false;
                const classes = mobile
                    ? `flex items-center gap-3 rounded px-3 py-2.5 text-sm ${isActive ? "bg-slate-800 text-white" : "text-slate-200"}`
                    : `relative flex items-center gap-1.5 border-b-2 px-3 text-xs font-semibold transition-colors ${isActive ? "border-blue-400 text-white" : "border-transparent text-slate-300 hover:border-slate-500 hover:text-white"}`;

                return item.href ? (
                    <Link
                        key={item.label}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={classes}
                    >
                        {mobile && (
                            <span
                                aria-hidden="true"
                                className="material-symbols-outlined text-lg"
                            >
                                {item.icon}
                            </span>
                        )}
                        {item.label}
                    </Link>
                ) : (
                    <span
                        key={item.label}
                        title="Not available yet"
                        aria-disabled="true"
                        className={`${classes} cursor-not-allowed opacity-55`}
                    >
                        {mobile && (
                            <span
                                aria-hidden="true"
                                className="material-symbols-outlined text-lg"
                            >
                                {item.icon}
                            </span>
                        )}
                        {item.label}
                        {!mobile && (
                            <span className="rounded border border-slate-600 px-1 py-0.5 text-[8px] font-medium uppercase tracking-wider text-slate-400">
                                Soon
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

/**
 * Rendered only once inside OfflineProvider, so it's the one place allowed
 * to know how many offline records are unsynchronized — LOGOUT (ends the
 * server session) warns about that; LOCK WORKSPACE (purely client-side,
 * see useWorkspaceLock) never needs to, since locking never touches
 * pending evidence.
 */
function UserMenu({ userName, userRole, onLockWorkspace }: { userName: string; userRole: string; onLockWorkspace: () => void }) {
    const { pendingCount } = useOffline();
    const { confirm } = useNotificationDialog();

    const handleLogout = async (event: { preventDefault: () => void }) => {
        event.preventDefault();

        if (pendingCount > 0) {
            const confirmed = await confirm({
                title: "Unsynchronized evidence on this device",
                message: `${pendingCount} offline record${pendingCount === 1 ? "" : "s"} on this device ${pendingCount === 1 ? "has" : "have"} not been synchronized yet. They will remain saved here, but won't reach the server until you sync from another session. Log out anyway?`,
                confirmLabel: "Log out anyway",
                tone: "warning",
            });

            if (!confirmed) {
                return;
            }
        }

        router.post(AuthenticatedSessionController.destroy().url);
    };

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded border border-transparent px-1.5 py-1 hover:border-slate-600 hover:bg-slate-800"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-700">
                        <span aria-hidden="true" className="material-symbols-outlined text-lg">
                            person
                        </span>
                    </span>
                    <span className="hidden max-w-36 text-left md:block">
                        <span className="block truncate text-xs font-semibold">{userName}</span>
                        <span className="block truncate text-[9px] text-slate-400">{formatRole(userRole)}</span>
                    </span>
                    <span aria-hidden="true" className="material-symbols-outlined text-base text-slate-400">
                        expand_more
                    </span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right">
                <Dropdown.Link href={ProfileController.edit()}>Profile</Dropdown.Link>
                <Dropdown.Link
                    href="#"
                    as="button"
                    onClick={(event) => {
                        event.preventDefault();
                        onLockWorkspace();
                    }}
                >
                    Lock Workspace
                </Dropdown.Link>
                <Dropdown.Link
                    href={AuthenticatedSessionController.destroy()}
                    method="post"
                    as="button"
                    onClick={(event) => void handleLogout(event)}
                >
                    Log out
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, can } = usePage<PageProps>().props;
    const currentPath = usePage().url.split("?")[0];
    const navigationItems: NavigationItem[] = [
        ...baseNavigationItems,
        ...(can.manageUsers ? [{ label: "Users", href: UserController.index().url, icon: "group" }] : []),
        ...(can.manageRoles ? [{ label: "Roles", href: RoleController.index().url, icon: "admin_panel_settings" }] : []),
    ];
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { notify } = useNotificationDialog();
    const { locked, lock, unlock } = useWorkspaceLock();
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();

        if (search.trim()) {
            router.get(SearchController.index().url, { q: search.trim() });
        }
    };

    // WORKSPACE LOCK is purely client-side UI state (see useWorkspaceLock) —
    // it never touches the Laravel session. While locked, none of the
    // authenticated content below is rendered at all, so case names,
    // evidence, and the pending-sync queue are never left sitting behind
    // this screen.
    if (locked) {
        return (
            <SecureLandingScreen
                user={{ id: auth.user.id, name: auth.user.name, role: auth.user.role }}
                loginHref={AuthenticatedSessionController.create().url}
                onUnlockOnline={() => unlock()}
                onUnlockOffline={() => unlock()}
            />
        );
    }

    return (
        <OfflineProvider>
            <div className="min-h-screen bg-slate-100 font-body-md text-slate-900 antialiased">
                <FlashNotificationDialog />
                <a
                    href="#main-content"
                    className="sr-only z-[70] bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:fixed focus:left-3 focus:top-3 focus:not-sr-only"
                >
                    Skip to main content
                </a>
                <header className="sticky top-0 z-50 border-b border-slate-950 bg-[#0b1f35] text-white shadow-sm">
                    <div className="mx-auto flex h-16 items-center gap-5 px-4 sm:px-6">
                        <Link
                            href={DashboardController.index()}
                            className="flex shrink-0 items-center gap-3"
                            aria-label="H1 Digital Evidence dashboard"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded border border-slate-600 bg-slate-800">
                                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
                            </span>
                            <span className="hidden leading-tight sm:block">
                                <span className="block text-sm font-bold tracking-[0.08em]">
                                    H1
                                </span>
                                <span className="block text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                    Digital Evidence Management System
                                </span>
                            </span>
                        </Link>
                        <div className="h-full flex-1">
                            <Navigation items={navigationItems} currentPath={currentPath} />
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <form
                                onSubmit={submitSearch}
                                className="relative hidden xl:block"
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400"
                                >
                                    search
                                </span>
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    aria-label="Search cases, evidence, and reports"
                                    placeholder="Search all records"
                                    className="h-9 w-56 rounded border border-slate-600 bg-slate-800 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                                />
                            </form>
                            <ConnectivityStatus />
                            <button
                                type="button"
                                title="Notifications"
                                aria-label="Open notifications"
                                onClick={() =>
                                    notify({
                                        title: "You're up to date",
                                        message: "There are no new system notifications requiring your attention.",
                                        tone: "info",
                                    })
                                }
                                className="relative flex h-9 w-9 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-xl"
                                >
                                    notifications
                                </span>
                            </button>
                            <UserMenu userName={auth.user.name} userRole={auth.user.role} onLockWorkspace={lock} />
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded border border-slate-600 lg:hidden"
                                aria-label="Toggle navigation"
                                aria-expanded={mobileMenuOpen}
                                onClick={() => setMobileMenuOpen((open) => !open)}
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-xl"
                                >
                                    {mobileMenuOpen ? "close" : "menu"}
                                </span>
                            </button>
                        </div>
                    </div>
                    {mobileMenuOpen && (
                        <div className="border-t border-slate-700 lg:hidden">
                            <Navigation items={navigationItems} currentPath={currentPath} mobile />
                        </div>
                    )}
                </header>
                <OfflineModeBanner />
                {header && (
                    <div className="border-b border-slate-200 bg-white">
                        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </div>
                )}
                <main
                    id="main-content"
                    tabIndex={-1}
                    className="app-workspace mx-auto min-h-[calc(100vh-113px)] w-full px-4 py-4 outline-none sm:px-5 lg:px-6 lg:py-5"
                >
                    {children}
                </main>
                <footer className="border-t border-slate-200 bg-white">
                    <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[10px] text-slate-500 sm:px-5 lg:px-6">
                        <span>H1 Digital Evidence Management System</span>
                        <span className="uppercase tracking-[0.12em]">
                            Authorized personnel only
                        </span>
                    </div>
                </footer>
            </div>
        </OfflineProvider>
    );
}
