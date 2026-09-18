import CustodyController from '@/actions/App/Http/Controllers/CustodyController';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import { Link } from '@inertiajs/react';

export type CaseTab = 'overview' | 'evidence';

interface CaseTabsProps {
    activeTab: CaseTab;
    evidenceCount: number;
    caseNumber: string;
    onChange: (tab: CaseTab) => void;
}

const FUTURE_TABS = [
    { label: 'Findings & Analysis', icon: 'policy' },
    { label: 'Activity Audit', icon: 'fact_check' },
] as const;

function tabClassName(isActive: boolean): string {
    return [
        'inline-flex shrink-0 items-center gap-2 rounded px-3.5 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        isActive
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-white hover:text-slate-900',
    ].join(' ');
}

export function CaseTabs({ activeTab, evidenceCount, caseNumber, onChange }: CaseTabsProps) {
    return (
        <nav
            aria-label="Case record sections"
            className="overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-1"
        >
            <div className="flex min-w-max items-center gap-1" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    onClick={() => onChange('overview')}
                    className={tabClassName(activeTab === 'overview')}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        dashboard
                    </span>
                    Overview
                </button>

                <Link
                    href={CustodyController.index({ query: { case: caseNumber } })}
                    className={tabClassName(false)}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        history_edu
                    </span>
                    Chain of Custody
                </Link>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'evidence'}
                    onClick={() => onChange('evidence')}
                    className={tabClassName(activeTab === 'evidence')}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        inventory_2
                    </span>
                    Evidence
                    <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                            activeTab === 'evidence' ? 'bg-white/15 text-white' : 'bg-white text-slate-600'
                        }`}
                    >
                        {evidenceCount}
                    </span>
                </button>

                {FUTURE_TABS.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        role="tab"
                        disabled
                        title="This module will be available in a later release"
                        className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded px-3.5 py-2 text-sm font-medium text-slate-400"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                            {tab.icon}
                        </span>
                        {tab.label}
                        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Soon
                        </span>
                    </button>
                ))}

                <Link
                    href={ReportController.index({ query: { case: caseNumber } })}
                    className={tabClassName(false)}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        picture_as_pdf
                    </span>
                    Generated Reports
                </Link>
            </div>
        </nav>
    );
}
