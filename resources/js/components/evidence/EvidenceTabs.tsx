export type EvidenceTab = "custody" | "copies" | "activity";

interface EvidenceTabsProps {
    activeTab: EvidenceTab;
    copiesCount: number;
    activityCount: number;
    onChange: (tab: EvidenceTab) => void;
}

function tabClassName(isActive: boolean): string {
    return [
        "inline-flex shrink-0 items-center gap-2 rounded px-3.5 py-2 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900",
    ].join(" ");
}

function CountBadge({ count, isActive }: { count: number; isActive: boolean }) {
    return (
        <span
            className={`rounded px-1.5 py-0.5 text-[10px] ${isActive ? "bg-white/15 text-white" : "bg-white text-slate-600"}`}
        >
            {count}
        </span>
    );
}

export function EvidenceTabs({ activeTab, copiesCount, activityCount, onChange }: EvidenceTabsProps) {
    return (
        <nav
            aria-label="Evidence record sections"
            className="overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-1"
        >
            <div className="flex min-w-max items-center gap-1" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "custody"}
                    onClick={() => onChange("custody")}
                    className={tabClassName(activeTab === "custody")}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        history_edu
                    </span>
                    Chain of Custody
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "copies"}
                    onClick={() => onChange("copies")}
                    className={tabClassName(activeTab === "copies")}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        file_copy
                    </span>
                    Working Copies
                    <CountBadge count={copiesCount} isActive={activeTab === "copies"} />
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "activity"}
                    onClick={() => onChange("activity")}
                    className={tabClassName(activeTab === "activity")}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                        fact_check
                    </span>
                    Activity & Provenance
                    <CountBadge count={activityCount} isActive={activeTab === "activity"} />
                </button>
            </div>
        </nav>
    );
}
