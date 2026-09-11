import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { EvidenceCaseSummary, VerificationEvidenceOption } from '@/types/evidence';
import { CalendarDays, Database, FileKey2, FolderOpen, ShieldCheck } from 'lucide-react';

interface EvidenceSelectionPanelProps {
    cases: EvidenceCaseSummary[];
    evidenceOptions: VerificationEvidenceOption[];
    selectedCaseId: string;
    selectedEvidenceNumber: string;
    onCaseChange: (caseId: string) => void;
    onEvidenceChange: (evidenceNumber: string) => void;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export function EvidenceSelectionPanel({
    cases,
    evidenceOptions,
    selectedCaseId,
    selectedEvidenceNumber,
    onCaseChange,
    onEvidenceChange,
}: EvidenceSelectionPanelProps) {
    const filteredEvidence = evidenceOptions.filter((evidence) => {
        if (selectedCaseId === '') return true;
        if (selectedCaseId === 'unassigned') return evidence.case === null;

        return evidence.case?.id === Number(selectedCaseId);
    });
    const selectedEvidence = evidenceOptions.find(
        (evidence) => evidence.evidence_number === selectedEvidenceNumber,
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded bg-slate-900 text-white">
                        <Database className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle>Registered evidence</CardTitle>
                        <CardDescription>Select the protected H1 baseline</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex min-h-[390px] flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="app-field-label">Filter by case</span>
                        <select
                            value={selectedCaseId}
                            onChange={(event) => onCaseChange(event.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                        >
                            <option value="">All authorised cases</option>
                            {cases.map((caseFile) => (
                                <option key={caseFile.id} value={caseFile.id}>
                                    {caseFile.case_number} — {caseFile.title}
                                </option>
                            ))}
                            {evidenceOptions.some((evidence) => evidence.case === null) ? (
                                <option value="unassigned">Unassigned intake</option>
                            ) : null}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="app-field-label">Select evidence</span>
                        <select
                            value={selectedEvidenceNumber}
                            onChange={(event) => onEvidenceChange(event.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:ring-blue-600"
                        >
                            <option value="">Choose an evidence record</option>
                            {filteredEvidence.map((evidence) => (
                                <option key={evidence.id} value={evidence.evidence_number}>
                                    {evidence.evidence_number} — {evidence.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {selectedEvidence ? (
                    <div className="flex flex-1 flex-col justify-between rounded-md border border-blue-200 bg-blue-50/50 p-5">
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-mono text-lg font-bold text-blue-950">
                                        {selectedEvidence.evidence_number}
                                    </p>
                                    <p className="pt-1 text-sm font-semibold text-slate-800">
                                        {selectedEvidence.title}
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-blue-200 bg-white text-blue-800">
                                    Protected master
                                </Badge>
                            </div>

                            <dl className="mt-6 grid gap-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <FolderOpen className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt className="text-xs text-slate-500">Case</dt>
                                        <dd className="font-semibold text-slate-800">
                                            {selectedEvidence.case?.case_number ?? 'Unassigned intake'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FileKey2 className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt className="text-xs text-slate-500">Evidence type</dt>
                                        <dd className="font-semibold capitalize text-slate-800">
                                            {selectedEvidence.evidence_type.replace(/_/g, ' ').toLowerCase()}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt className="text-xs text-slate-500">Registered</dt>
                                        <dd className="font-semibold text-slate-800">
                                            {formatDate(selectedEvidence.registered_at)}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        <div className="mt-6 flex items-center gap-2 border-t border-blue-200 pt-4 text-xs font-bold uppercase tracking-wider text-blue-800">
                            <ShieldCheck className="h-4 w-4" />
                            Baseline established
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <Database className="h-9 w-9 text-slate-300" />
                        <p className="pt-3 text-sm font-semibold text-slate-700">No evidence selected</p>
                        <p className="max-w-xs pt-1 text-xs leading-5 text-slate-500">
                            Select a registered record to load its immutable SHA-256 baseline.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
