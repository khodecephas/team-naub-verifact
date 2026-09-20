import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { EvidenceCustodySection } from "@/components/custody/EvidenceCustodySection";
import { EvidenceActivityPanel } from "@/components/evidence/EvidenceActivityPanel";
import { EvidenceAutoVerifyDialog } from "@/components/evidence/EvidenceAutoVerifyDialog";
import { EvidenceIntakeCompletion } from "@/components/evidence/EvidenceIntakeCompletion";
import { EvidenceIntegrityPanel } from "@/components/evidence/EvidenceIntegrityPanel";
import { EvidenceTab, EvidenceTabs } from "@/components/evidence/EvidenceTabs";
import { EvidenceWorkingCopies } from "@/components/evidence/EvidenceWorkingCopies";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBytes } from "@/lib/utils";
import {
    Evidence,
    EvidenceActivityLogEntry,
    EvidenceCustodyEvent,
    EvidenceCustodyRequest,
    EvidenceDerivative,
    EvidenceIntakeCase,
    EvidencePermissions,
    EvidencePersonSummary,
    EvidenceVerification,
} from "@/types/evidence";
import { Head, Link, router } from "@inertiajs/react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface ShowProps {
    evidence: Evidence;
    verifications: EvidenceVerification[];
    custodyEvents: EvidenceCustodyEvent[];
    custodyRequests: EvidenceCustodyRequest[];
    custodyChainVerified: boolean;
    activityEvents: EvidenceActivityLogEntry[];
    derivatives: EvidenceDerivative[];
    eligibleCustodians: EvidencePersonSummary[];
    eligibleDerivativeRecipients: EvidencePersonSummary[];
    workingCopyRetention: {
        default: number;
        options: number[];
    };
    fileAvailable: boolean;
    intakeOptions: {
        cases: EvidenceIntakeCase[];
        evidenceTypes: string[];
    };
    permissions: EvidencePermissions;
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function RecordField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </dt>
            <dd className="pt-1 text-sm font-semibold text-slate-800">
                {children}
            </dd>
        </div>
    );
}

export default function Show({
    evidence,
    verifications,
    custodyEvents,
    custodyRequests,
    custodyChainVerified,
    activityEvents,
    derivatives,
    eligibleCustodians,
    eligibleDerivativeRecipients,
    workingCopyRetention,
    fileAvailable,
    intakeOptions,
    permissions,
}: ShowProps) {
    const [verifying, setVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState<EvidenceTab>("custody");
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [autoVerifyDialogOpen, setAutoVerifyDialogOpen] = useState(false);
    const hasAutoVerified = useRef(false);

    const verifyIntegrity = () => {
        router.post(
            EvidenceController.verify(evidence.evidence_number).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setVerifying(true),
                onFinish: () => setVerifying(false),
            },
        );
    };

    // Automatically re-verify integrity whenever this record is opened —
    // the same check "Verify integrity" triggers manually, just run on
    // mount. Only for users authorised to verify (permissions.verify
    // already accounts for role and file availability); guarded by a ref
    // so the reload this triggers (which refreshes `verifications` but not
    // `evidence.evidence_number`) never causes a second automatic check.
    useEffect(() => {
        if (hasAutoVerified.current || !permissions.verify) {
            return;
        }

        hasAutoVerified.current = true;
        setAutoVerifyDialogOpen(true);
        verifyIntegrity();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evidence.evidence_number, permissions.verify]);

    return (
        <AuthenticatedLayout>
            <Head title={`${evidence.evidence_number} — ${evidence.title}`} />

            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link
                                href={EvidenceController.index()}
                                className="hover:text-slate-900"
                            >
                                Evidence
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="font-mono">
                                {evidence.evidence_number}
                            </span>
                        </>
                    }
                    title={evidence.title}
                    description="Protected master record, integrity history, custody, and controlled working copies."
                    actions={
                        <>
                            {permissions.viewFile ? (
                                <Button variant="outline" asChild>
                                    <a
                                        href={
                                            EvidenceController.viewFile(
                                                evidence.evidence_number,
                                            ).url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined text-[18px]"
                                        >
                                            visibility
                                        </span>
                                        View file
                                    </a>
                                </Button>
                            ) : (
                                <Button variant="outline" disabled>
                                    View file
                                </Button>
                            )}

                            <Button
                                onClick={verifyIntegrity}
                                disabled={!permissions.verify || verifying}
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-[18px]"
                                >
                                    published_with_changes
                                </span>
                                {verifying ? "Verifying…" : "Verify integrity"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setCopyDialogOpen(true)}
                                disabled={!permissions.issueWorkingCopy}
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-[18px]"
                                >
                                    content_copy
                                </span>
                                Issue working copy
                            </Button>
                        </>
                    }
                />

                {!fileAvailable ? (
                    <div
                        role="alert"
                        className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4"
                    >
                        <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-red-700"
                        >
                            cloud_off
                        </span>
                        <div>
                            <p className="text-sm font-bold text-red-900">
                                Master evidence file unavailable
                            </p>
                            <p className="pt-1 text-xs leading-5 text-red-800">
                                The database record exists, but its file is
                                missing from controlled storage. File viewing,
                                verification, and working-copy issuance are
                                disabled until the storage record is restored.
                            </p>
                        </div>
                    </div>
                ) : null}

                {permissions.completeIntake ? (
                    <EvidenceIntakeCompletion
                        evidence={evidence}
                        cases={intakeOptions.cases}
                        evidenceTypes={intakeOptions.evidenceTypes}
                    />
                ) : null}

                <section
                    aria-label="Evidence record identity"
                    className="rounded-md border border-slate-200 bg-white shadow-sm"
                >
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-blue-900">
                                {evidence.evidence_number}
                            </span>
                            <StatusBadge status={evidence.integrity_status} />
                            <Badge variant="outline">
                                {evidence.evidence_type.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant="muted">
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-[14px]"
                                >
                                    lock
                                </span>
                                Protected master
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                            Registered {formatDateTime(evidence.registered_at)}
                        </p>
                    </div>

                    <dl className="grid gap-5 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                        <RecordField label="Original filename">
                            {evidence.original_filename}
                        </RecordField>
                        <RecordField label="File format">
                            {evidence.mime_type ?? "Unknown"} ·{" "}
                            {formatBytes(evidence.file_size_bytes)}
                        </RecordField>
                        <RecordField label="Registered by">
                            {evidence.registered_by?.name ?? "Not recorded"}
                        </RecordField>
                        <RecordField label="Current custodian">
                            {evidence.current_custodian?.name ??
                                evidence.registered_by?.name ??
                                "Not assigned"}
                        </RecordField>
                    </dl>
                </section>

                <div className="grid gap-5 xl:grid-cols-12">
                    <div className="flex flex-col gap-5 xl:col-span-8">
                        <EvidenceIntegrityPanel
                            evidence={evidence}
                            verifications={verifications}
                            canVerify={permissions.verify}
                        />

                        <EvidenceTabs
                            activeTab={activeTab}
                            copiesCount={derivatives.length}
                            activityCount={activityEvents.length}
                            onChange={setActiveTab}
                        />

                        {activeTab === "custody" ? (
                            <EvidenceCustodySection
                                evidence={evidence}
                                events={custodyEvents}
                                requests={custodyRequests}
                                eligibleCustodians={eligibleCustodians}
                                canRequest={permissions.requestCustody}
                                canDirectTransfer={
                                    permissions.directTransferCustody
                                }
                                isCurrentCustodian={
                                    permissions.isCurrentCustodian
                                }
                                chainVerified={custodyChainVerified}
                            />
                        ) : activeTab === "copies" ? (
                            <EvidenceWorkingCopies
                                evidence={evidence}
                                derivatives={derivatives}
                                recipients={eligibleDerivativeRecipients}
                                retention={workingCopyRetention}
                                canIssue={permissions.issueWorkingCopy}
                                dialogOpen={copyDialogOpen}
                                onDialogOpenChange={setCopyDialogOpen}
                            />
                        ) : (
                            <EvidenceActivityPanel evidence={evidence} events={activityEvents} />
                        )}
                    </div>

                    <aside className="flex flex-col gap-5 xl:col-span-4">
                        <Panel>
                            <PanelHeader
                                title="Evidence details"
                                description="Recorded classification and source"
                            />
                            <dl className="grid gap-4 p-5">
                                <RecordField label="Evidence ID">
                                    {evidence.evidence_number}
                                </RecordField>
                                <RecordField label="Classification">
                                    <span className="capitalize">
                                        {evidence.evidence_type
                                            .replace(/_/g, " ")
                                            .toLowerCase()}
                                    </span>
                                </RecordField>
                                <RecordField label="Associated case">
                                    {evidence.case ? (
                                        <Link
                                            href={CaseController.show(
                                                evidence.case.case_number,
                                            )}
                                            className="text-blue-800 hover:underline"
                                        >
                                            {evidence.case.case_number} —{" "}
                                            {evidence.case.title}
                                        </Link>
                                    ) : (
                                        "Not assigned"
                                    )}
                                </RecordField>
                                <RecordField label="Physical source">
                                    {evidence.physical_source?.label ??
                                        "Digital intake"}
                                </RecordField>
                                <RecordField label="Custody location">
                                    {evidence.current_custody_location ??
                                        "Not recorded"}
                                </RecordField>
                            </dl>
                        </Panel>

                        <Panel>
                            <PanelHeader
                                title="Collection notes"
                                description="Registration context"
                            />
                            <p className="whitespace-pre-line p-5 text-sm leading-6 text-slate-700">
                                {evidence.description ||
                                    "No collection notes were recorded."}
                            </p>
                        </Panel>

                        <Panel>
                            <PanelHeader
                                title="Record activity"
                                description="Operational history summary"
                            />
                            <div className="grid grid-cols-3 gap-px bg-slate-200">
                                <div className="bg-white p-4 text-center">
                                    <p className="font-mono text-xl font-bold text-slate-900">
                                        {verifications.length}
                                    </p>
                                    <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Checks
                                    </p>
                                </div>
                                <div className="bg-white p-4 text-center">
                                    <p className="font-mono text-xl font-bold text-slate-900">
                                        {custodyEvents.length}
                                    </p>
                                    <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Transfers
                                    </p>
                                </div>
                                <div className="bg-white p-4 text-center">
                                    <p className="font-mono text-xl font-bold text-slate-900">
                                        {derivatives.length}
                                    </p>
                                    <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Copies
                                    </p>
                                </div>
                            </div>
                        </Panel>
                    </aside>
                </div>
            </div>

            <EvidenceAutoVerifyDialog
                open={autoVerifyDialogOpen}
                verifying={verifying}
                evidenceNumber={evidence.evidence_number}
                latestVerification={verifications[0]}
                onClose={() => setAutoVerifyDialogOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
