import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import CaseController from '@/actions/App/Http/Controllers/CaseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import ProfileController from '@/actions/App/Http/Controllers/ProfileController';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface NavItem {
    label: string;
    href?: string;
    icon: string;
}

/** Turns "EVIDENCE_CUSTODIAN" into "Evidence Custodian" for display. */
function formatRole(role: string): string {
    return role
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Fixed top-nav shell for authenticated pages (from the Stitch Dashboard
 * design). "Chain of Custody", "Verify & Compare", and "Non-Technical
 * Reports" have no controller/pages yet, so they render as disabled labels
 * rather than linking to nothing. The optional `header` prop stays
 * for pages built before this redesign (Evidence, Profile); new pages
 * should render their own heading inside `children` instead, as Dashboard
 * does.
 */
export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;
    const currentPath = usePage().url;

    const navItems: NavItem[] = [
        { label: 'Dashboard', href: DashboardController.index().url, icon: 'space_dashboard' },
        { label: 'Cases', href: CaseController.index().url, icon: 'folder_open' },
        { label: 'Evidence', href: EvidenceController.index().url, icon: 'inventory_2' },
        { label: 'Chain of Custody', icon: 'link' },
        { label: 'Verify & Compare', icon: 'fact_check' },
        { label: 'Non-Technical Reports', icon: 'description' },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background font-body-md text-on-surface antialiased">
            <header className="fixed inset-x-0 top-0 z-50 w-full bg-white shadow-xs">
                <div className="flex h-16 w-full items-center justify-between gap-6 px-6">
                    <div className="flex shrink-0 items-center gap-3">
                        <Link href={DashboardController.index()} className="flex items-center gap-2">
                            <ApplicationLogo className="h-7 w-7 fill-current text-slate-900" />
                            <div className="flex flex-col leading-none">
                                <span className="text-sm font-bold tracking-tight text-slate-900">H1</span>
                                <span className="text-[10px] font-medium text-slate-500">Digital Evidence</span>
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden items-center gap-1 xl:flex">
                        {navItems.map((item) =>
                            item.href ? (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        currentPath.startsWith(item.href)
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    key={item.label}
                                    title="Not available yet"
                                    className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
                                >
                                    {item.label}
                                </span>
                            ),
                        )}
                    </nav>

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="relative hidden lg:block">
                            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                                search
                            </span>
                            <input
                                type="text"
                                disabled
                                title="Search isn't available yet"
                                placeholder="Search Case ID, hash, custodian…"
                                className="h-9 w-64 cursor-not-allowed rounded-lg border-0 bg-slate-100 pl-9 pr-3 text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="h-5 w-px bg-slate-200" />

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="group flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100" type="button">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
                                        <span className="material-symbols-outlined text-[18px] text-white">person</span>
                                    </span>
                                    <span className="hidden text-left sm:block">
                                        <span className="block text-sm font-semibold leading-tight text-slate-900">
                                            {auth.user.name}
                                        </span>
                                        <span className="block text-xs leading-tight text-slate-500">
                                            {formatRole(auth.user.role)}
                                        </span>
                                    </span>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={ProfileController.edit()}>Profile</Dropdown.Link>
                                <Dropdown.Link href={AuthenticatedSessionController.destroy()} method="post" as="button">
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </header>

            {header && (
                <div className="border-b border-slate-200 bg-white pt-16">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </div>
            )}

            <main className={header ? 'w-full' : 'w-full pt-16'}>{children}</main>

            <footer className="mt-auto w-full border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                        <span>H1 Digital Evidence Management System</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
