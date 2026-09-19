import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import ReportController from "@/actions/App/Http/Controllers/ReportController";
import { CaseCustodyRegister } from "@/components/cases/CaseCustodyRegister";
import { CaseEvidenceRegister } from "@/components/cases/CaseEvidenceRegister";
import { CaseFindingsRegister } from "@/components/cases/CaseFindingsRegister";
import { CaseOverview } from "@/components/cases/CaseOverview";
import { CaseReportsRegister } from "@/components/cases/CaseReportsRegister";
import { CaseTab, CaseTabs } from "@/components/cases/CaseTabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    CaseCustody,
    CaseDetail,
    CaseFindings,
    CaseIntegritySummary,
    CasePersonnel,
    CaseReport,
    CaseTimelineEntry,
    PhysicalSourceSummary,
} from "@/types/case";
import { Evidence } from "@/types/evidence";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";

interface ShowProps {
    case: CaseDetail;
    personnel: CasePersonnel[];
    evidence: Evidence[];
    physicalSources: PhysicalSourceSummary[];
    integrity: CaseIntegritySummary;
    timeline: CaseTimelineEntry[];
    canArchive: boolean;
    canRegisterEvidence: boolean;
    custody: CaseCustody;
    reports: CaseReport[];
    canCreateReport: boolean;
    findings: CaseFindings;
    canRecordFinding: boolean;
    initialTab: CaseTab;
}

function formatDate(value: string | null): string {
    if (!value) {
        return "Not recorded";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function RecordDetail({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-[180px] items-center gap-2.5">
            <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] text-slate-400"
            >
                {icon}
            </span>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <p className="pt-0.5 text-sm font-semibold text-slate-700">
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function Show({
    case: caseFile,
    personnel,
    evidence,
    physicalSources,
    integrity,
    timeline,
    canArchive,
    canRegisterEvidence,
    custody,
    reports,
    canCreateReport,
    findings,
    canRecordFinding,
    initialTab,
}: ShowProps) {
    const [activeTab, setActiveTab] = useState<CaseTab>(initialTab);
    const { confirm } = useNotificationDialog();

    const archiveCase = async () => {
        const confirmed = await confirm({
            title: "Close this case?",
            message: `Archive ${caseFile.case_number}? This closes the case and preserves its existing records.`,
            confirmLabel: "Close case",
            tone: "warning",
        });

        if (!confirmed) {
            return;
        }

        router.post(CaseController.archive(caseFile.case_number).url);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${caseFile.case_number} — ${caseFile.title}`} />

            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link
                                href={CaseController.index()}
                                className="hover:text-slate-900"
                            >
                                Cases
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="font-mono">
                                {caseFile.case_number}
                            </span>
                        </>
                    }
                    title={caseFile.title}
                    description="Authorised case record, evidence holdings, personnel, and integrity state."
                    actions={
                        <>
                            {canRegisterEvidence ? (
                                <Button asChild>
                                    <Link
                                        href={EvidenceController.create(
                                            caseFile.case_number,
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined text-[18px]"
                                        >
                                            add_circle
                                        </span>
                                        Register evidence
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    title="You do not have access to register evidence on this case"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[18px]"
                                    >
                                        add_circle
                                    </span>
                                    Register evidence
                                </Button>
                            )}

                            <Button variant="outline" asChild>
                                <Link
                                    href={`${ReportController.create().url}?case=${caseFile.case_number}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[18px]"
                                    >
                                        description
                                    </span>
                                    Create report
                                </Link>
                            </Button>

                            {canArchive ? (
                                <Button
                                    variant="destructive"
                                    onClick={archiveCase}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[18px]"
                                    >
                                        archive
                                    </span>
                                    Close case
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <section
                    aria-label="Case record summary"
                    className="rounded-md border border-slate-200 bg-white shadow-sm"
                >
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-sm font-bold tracking-wide text-blue-900">
                                {caseFile.case_number}
                            </span>
                            <StatusBadge status={caseFile.status} />
                            <span
                                title="No structured priority field is available yet"
                                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                            >
                                Priority not classified
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Created by {caseFile.creator ?? "Not recorded"}
                        </p>
                    </div>

                    <div className="grid gap-5 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                        <RecordDetail
                            icon="badge"
                            label="Case manager"
                            value={caseFile.case_manager ?? "Unassigned"}
                        />
                        <RecordDetail
                            icon="event_available"
                            label="Opened"
                            value={formatDate(caseFile.opened_at)}
                        />
                        <RecordDetail
                            icon="event_note"
                            label="Incident date"
                            value="Not recorded"
                        />
                        <RecordDetail
                            icon="inventory_2"
                            label="Evidence holdings"
                            value={`${evidence.length} registered item${evidence.length === 1 ? "" : "s"}`}
                        />
                    </div>

                    {caseFile.closed_at ? (
                        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                            Closed {formatDate(caseFile.closed_at)}
                            {caseFile.closer ? ` by ${caseFile.closer}` : ""}
                        </div>
                    ) : null}
                </section>

                <CaseTabs
                    activeTab={activeTab}
                    evidenceCount={evidence.length}
                    reportsCount={reports.length}
                    findingsCount={findings.items.length}
                    onChange={setActiveTab}
                />

                {activeTab === "overview" ? (
                    <CaseOverview
                        caseFile={caseFile}
                        personnel={personnel}
                        integrity={integrity}
                        timeline={timeline}
                        evidenceCount={evidence.length}
                        physicalSourceCount={physicalSources.length}
                        canRegisterEvidence={canRegisterEvidence}
                    />
                ) : activeTab === "custody" ? (
                    <CaseCustodyRegister
                        holdings={custody.holdings}
                        history={custody.history}
                    />
                ) : activeTab === "reports" ? (
                    <CaseReportsRegister
                        reports={reports}
                        caseNumber={caseFile.case_number}
                        canCreateReport={canCreateReport}
                    />
                ) : activeTab === "findings" ? (
                    <CaseFindingsRegister
                        findings={findings}
                        caseNumber={caseFile.case_number}
                        canRecordFinding={canRecordFinding}
                    />
                ) : (
                    <CaseEvidenceRegister
                        evidence={evidence}
                        physicalSources={physicalSources}
                        caseNumber={caseFile.case_number}
                        onOpenCustody={() => setActiveTab("custody")}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
