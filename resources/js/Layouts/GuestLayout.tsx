import ApplicationLogo from '@/Components/ApplicationLogo';
import { FlashNotificationDialog } from '@/components/notifications/FlashNotificationDialog';
import { PropsWithChildren } from 'react';

/**
 * "Forensic Portal" shell for unauthenticated pages (Login, Register,
 * password reset, ...) — a fixed left branding/trust panel and a right
 * panel whose center content (heading, status, form) is supplied by the
 * page via `children`.
 */
export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-surface font-body-md text-on-surface antialiased selection:bg-slate-900 selection:text-white lg:flex-row">
            <FlashNotificationDialog />
            <aside className="relative flex w-full flex-col justify-between overflow-hidden border-r border-slate-800 bg-[#0B1329] p-8 text-white sm:p-12 lg:w-[46%] lg:p-14 xl:w-[44%] xl:p-16">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] opacity-40 [background-size:24px_24px]" />
                <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center rounded-[0.25rem] border border-slate-700/30 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm">
                        <ApplicationLogo className="h-8 w-auto fill-current text-slate-900" />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 font-label-md text-[11px] uppercase tracking-wider text-slate-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        FIPS 140-3 Compliant
                    </div>
                </div>

                <div className="relative z-10 my-auto flex flex-col gap-8 py-10">
                    <div className="flex max-w-lg flex-col gap-3">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            Forensic Custody Architecture
                        </div>
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                            Secure Chain of Custody &amp; Evidence Verification
                        </h1>
                        <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                            The national benchmark for law enforcement, judicial defense, and
                            accredited forensic laboratories managing digital exhibits.
                        </p>
                    </div>

                    <div className="flex flex-col gap-5 pt-2">
                        <TrustPillar icon="fingerprint" title="End-to-End Cryptographic Integrity">
                            Automated SHA-256 fingerprinting and continuous ledger tamper
                            verification at ingest.
                        </TrustPillar>
                        <TrustPillar icon="gavel" title="Court-Admissible Provenance">
                            Unbroken chain of custody records structured for direct judicial
                            presentation and discovery defense.
                        </TrustPillar>
                        <TrustPillar icon="security" title="Government & Enterprise Grade">
                            Full adherence to CJIS Security Policy Level 4, ISO/IEC 27037, and
                            NIST SP 800-86.
                        </TrustPillar>
                    </div>
                </div>

                <div className="relative z-10 border-t border-slate-800/80 pt-4 text-[11px] leading-relaxed text-slate-400">
                    <span className="font-semibold text-slate-300">
                        Official Law Enforcement &amp; Enterprise Forensics Portal.
                    </span>{' '}
                    Unauthorized access is strictly prohibited under 18 U.S.C. § 1030. All
                    network actions are continuously audited and archived.
                </div>
            </aside>

            <main className="flex w-full flex-col justify-between bg-[#F8FAFC] p-6 sm:p-10 lg:w-[54%] lg:p-14 xl:w-[56%] xl:p-16">
                <header className="flex w-full items-center justify-between border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                        </span>
                        <span>CJIS Validated Environment</span>
                    </div>
                    <a href="#" className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
                        <span className="material-symbols-outlined text-[15px]">help_outline</span>
                        Support Desk
                    </a>
                </header>

                <div className="mx-auto my-auto w-full max-w-xl py-8">{children}</div>

                <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-600 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-slate-600">policy</span>
                        <span>Authorized Personnel Only • Federal &amp; Enterprise Rules Apply</span>
                    </div>
                    <a href="#" className="hover:text-slate-900 hover:underline">
                        Privacy &amp; CJIS Terms
                    </a>
                </footer>
            </main>
        </div>
    );
}

function TrustPillar({ icon, title, children }: PropsWithChildren<{ icon: string; title: string }>) {
    return (
        <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.25rem] border border-slate-700 bg-slate-800/80 text-blue-400">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{children}</p>
            </div>
        </div>
    );
}
