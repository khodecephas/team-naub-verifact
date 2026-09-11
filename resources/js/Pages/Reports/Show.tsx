import ReportController from "@/actions/App/Http/Controllers/ReportController";
import { PageHeader } from "@/components/layout/PageHeader";
import {
    CustodyReportTimeline,
    EvidenceReportSummary,
    IntegrityExplanation,
    ReportEvidence,
    WorkingCopyReportSummary,
} from "@/components/reports/ReportEvidenceSections";
import { ReportSection } from "@/components/reports/ReportSection";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { TechnicalAppendix } from "@/components/reports/TechnicalAppendix";
import { Button } from "@/components/ui/button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";

interface Snapshot {
    report: {
        report_number: string;
        title: string;
        introduction: string | null;
        status: string;
        generated_by: string;
        generated_at: string | null;
    };
    case: { case_number: string; title: string; summary: string | null };
    integrity_explanation: string;
    working_copy_explanation: string;
    evidence: ReportEvidence[];
    findings: { title: string; summary: string }[];
    findings_note: string;
    conclusion: string;
}
interface ReportView {
    report_number: string;
    title: string;
    status: string;
    snapshot: Snapshot;
    technical_details: {
        evidence: Parameters<typeof TechnicalAppendix>[0]["evidence"];
    } | null;
    report_sha256: string | null;
    content_verified: boolean | null;
    finalized_at: string | null;
    downloads_count: number;
    last_downloaded_at: string | null;
}
const dateTime = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: "long",
              timeStyle: "short",
          }).format(new Date(value))
        : "Draft — not finalized";

export default function Show({
    report,
    showAppendix,
    canFinalize,
}: {
    report: ReportView;
    showAppendix: boolean;
    canFinalize: boolean;
}) {
    const snapshot = report.snapshot;
    const finalize = () =>
        router.post(ReportController.finalize(report.report_number).url);
    const downloadUrl = `${ReportController.download(report.report_number).url}${showAppendix ? "?appendix=1" : ""}`;
    const printUrl = `${ReportController.download(report.report_number).url}?mode=print${showAppendix ? "&appendix=1" : ""}`;
    const canDeliver =
        report.status !== "DRAFT" && report.content_verified === true;

    return (
        <AuthenticatedLayout>
            <Head title={report.report_number} />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link
                                href={ReportController.index()}
                                className="hover:text-slate-900"
                            >
                                Reports
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="font-mono">
                                {report.report_number}
                            </span>
                        </>
                    }
                    title={report.title}
                    description={
                        report.status === "DRAFT"
                            ? "Review this draft before finalization. Finalization refreshes the selected records and freezes the report contents."
                            : "Finalized non-technical evidence report generated from a preserved historical snapshot."
                    }
                    actions={
                        <>
                            {report.status !== "DRAFT" && (
                                <>
                                    {canDeliver ? (
                                        <>
                                            <Button variant="outline" asChild>
                                                <a
                                                    href={printUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <span className="material-symbols-outlined text-[17px]">
                                                        print
                                                    </span>
                                                    Print PDF
                                                </a>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <a href={downloadUrl}>
                                                    <span className="material-symbols-outlined text-[17px]">
                                                        download
                                                    </span>
                                                    Download PDF
                                                </a>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" disabled>
                                                <span className="material-symbols-outlined text-[17px]">
                                                    print
                                                </span>
                                                Print blocked
                                            </Button>
                                            <Button variant="outline" disabled>
                                                <span className="material-symbols-outlined text-[17px]">
                                                    download
                                                </span>
                                                Download blocked
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        showAppendix
                                            ? ReportController.show(
                                                  report.report_number,
                                              )
                                            : `${ReportController.show(report.report_number).url}?appendix=1`
                                    }
                                >
                                    <span className="material-symbols-outlined text-[17px]">
                                        data_object
                                    </span>
                                    {showAppendix
                                        ? "Hide appendix"
                                        : "Technical appendix"}
                                </Link>
                            </Button>
                            {canFinalize && (
                                <Button onClick={finalize}>
                                    <span className="material-symbols-outlined text-[17px]">
                                        verified
                                    </span>
                                    Finalize report
                                </Button>
                            )}
                        </>
                    }
                />

                {report.status !== "DRAFT" && (
                    <div
                        className={`flex items-center gap-4 rounded-md border p-5 ${report.content_verified ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-2 border-red-600 bg-red-50 text-red-950 shadow-md"}`}
                    >
                        <span
                            className={`material-symbols-outlined ${report.content_verified ? "" : "text-3xl text-red-700"}`}
                        >
                            {report.content_verified
                                ? "verified_user"
                                : "gpp_bad"}
                        </span>
                        <div>
                            <p
                                className={`${report.content_verified ? "text-sm" : "text-base uppercase tracking-wide"} font-bold`}
                            >
                                {report.content_verified
                                    ? "Finalized report content verified"
                                    : "Content changed — print and download blocked"}
                            </p>
                            <p className="mt-1 text-xs">
                                {report.content_verified
                                    ? "The stored report matches the fingerprint created when it was finalized."
                                    : "This report no longer matches the fingerprint recorded at finalization. Treat it as altered and investigate before relying on it."}
                            </p>
                            {report.content_verified &&
                                report.downloads_count > 0 && (
                                    <p className="mt-2 text-xs font-semibold">
                                        Delivered {report.downloads_count} time
                                        {report.downloads_count === 1
                                            ? ""
                                            : "s"}
                                        {report.last_downloaded_at
                                            ? ` · Last delivery ${dateTime(report.last_downloaded_at)}`
                                            : ""}
                                    </p>
                                )}
                        </div>
                    </div>
                )}

                <article className="report-document mx-auto w-full max-w-5xl bg-white px-7 py-10 shadow-sm ring-1 ring-slate-200 sm:px-12 lg:px-16">
                    <header className="border-b-2 border-slate-900 pb-6">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                    H1 Digital Evidence Management System
                                </p>
                                <h1 className="mt-3 text-2xl font-bold uppercase tracking-tight text-slate-950">
                                    Digital Evidence Integrity Report
                                </h1>
                            </div>
                            <ReportStatusBadge status={report.status} />
                        </div>
                        <dl className="mt-6 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                            <HeaderDetail
                                label="Report No."
                                value={snapshot.report.report_number}
                                mono
                            />
                            <HeaderDetail
                                label="Case No."
                                value={snapshot.case.case_number}
                                mono
                            />
                            <HeaderDetail
                                label="Generated by"
                                value={snapshot.report.generated_by}
                            />
                            <HeaderDetail
                                label="Generated"
                                value={dateTime(snapshot.report.generated_at)}
                            />
                        </dl>
                    </header>

                    {snapshot.report.introduction && (
                        <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-4 text-sm italic leading-7 text-slate-700">
                            {snapshot.report.introduction}
                        </div>
                    )}
                    <div className="mt-8 space-y-8">
                        <ReportSection number={1} title="Case Summary">
                            <h3 className="font-semibold text-slate-950">
                                {snapshot.case.title}
                            </h3>
                            <p className="mt-2 whitespace-pre-line">
                                {snapshot.case.summary ||
                                    "No case summary was recorded."}
                            </p>
                        </ReportSection>
                        <EvidenceReportSummary evidence={snapshot.evidence} />
                        <IntegrityExplanation
                            explanation={snapshot.integrity_explanation}
                            evidence={snapshot.evidence}
                        />
                        <CustodyReportTimeline evidence={snapshot.evidence} />
                        <WorkingCopyReportSummary
                            explanation={snapshot.working_copy_explanation}
                            evidence={snapshot.evidence}
                        />
                        <ReportSection number={6} title="Findings">
                            {snapshot.findings.length > 0 ? (
                                snapshot.findings.map((finding) => (
                                    <div key={finding.title} className="mb-3">
                                        <h3 className="font-semibold">
                                            {finding.title}
                                        </h3>
                                        <p className="mt-1">
                                            {finding.summary}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p>{snapshot.findings_note}</p>
                            )}
                        </ReportSection>
                        <ReportSection number={7} title="Conclusion">
                            <div className="rounded border border-slate-300 bg-slate-50 p-5 font-medium text-slate-900">
                                {snapshot.conclusion}
                            </div>
                        </ReportSection>
                        {showAppendix && report.technical_details && (
                            <TechnicalAppendix
                                evidence={report.technical_details.evidence}
                            />
                        )}
                    </div>
                    <footer className="mt-10 border-t border-slate-300 pt-4 text-[10px] leading-5 text-slate-500">
                        <p>
                            This report describes records held by H1. A matching
                            digital fingerprint makes later modification
                            detectable; it does not independently establish the
                            authenticity or truth of evidence before
                            registration.
                        </p>
                        {report.report_sha256 && (
                            <p className="mt-2 font-mono">
                                Final report fingerprint: {report.report_sha256}
                            </p>
                        )}
                    </footer>
                </article>
            </div>
        </AuthenticatedLayout>
    );
}

function HeaderDetail({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <dt className="font-bold uppercase tracking-wider text-slate-500">
                {label}
            </dt>
            <dd
                className={`mt-1 font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}
            >
                {value}
            </dd>
        </div>
    );
}
