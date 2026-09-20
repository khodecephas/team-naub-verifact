import CaseController from '@/actions/App/Http/Controllers/CaseController';
import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { useNotificationDialog } from '@/components/notifications/NotificationDialogProvider';
import {
    AssignableUser,
    CaseDetail,
    CaseIntegritySummary,
    CasePersonnel,
    CaseTimelineEntry,
} from '@/types/case';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface CaseOverviewProps {
    caseFile: CaseDetail;
    personnel: CasePersonnel[];
    integrity: CaseIntegritySummary;
    timeline: CaseTimelineEntry[];
    evidenceCount: number;
    physicalSourceCount: number;
    canRegisterEvidence: boolean;
    canManageMembers: boolean;
    assignableUsers: AssignableUser[];
    caseAssignmentRoles: string[];
}

function formatCaseRole(role: string): string {
    return role
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function AddMemberDialog({
    open,
    onOpenChange,
    caseNumber,
    assignableUsers,
    caseAssignmentRoles,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    caseNumber: string;
    assignableUsers: AssignableUser[];
    caseAssignmentRoles: string[];
}) {
    const [userId, setUserId] = useState(String(assignableUsers[0]?.id ?? ''));
    const [roleOnCase, setRoleOnCase] = useState(caseAssignmentRoles[0] ?? '');
    const [processing, setProcessing] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.post(
            CaseController.storeMember(caseNumber).url,
            { user_id: userId, role_on_case: roleOnCase },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a case member</DialogTitle>
                    <DialogDescription>Grant a user a role on this specific case.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="grid gap-4 p-5">
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            User
                            <select
                                value={userId}
                                onChange={(event) => setUserId(event.target.value)}
                                required
                                className="h-10 rounded-md border-slate-300 text-sm font-normal"
                            >
                                {assignableUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            Case role
                            <select
                                value={roleOnCase}
                                onChange={(event) => setRoleOnCase(event.target.value)}
                                required
                                className="h-10 rounded-md border-slate-300 text-sm font-normal"
                            >
                                {caseAssignmentRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {formatCaseRole(role)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !userId}>
                            {processing ? 'Adding…' : 'Add member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const INVESTIGATION_STAGES = [
    { label: 'Case opened', icon: 'folder_open' },
    { label: 'Evidence acquired', icon: 'inventory_2' },
    { label: 'Working copies', icon: 'content_copy' },
    { label: 'Findings logged', icon: 'policy' },
    { label: 'Judicial review', icon: 'gavel' },
] as const;

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function SummaryMetric({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-slate-400">
                    {icon}
                </span>
            </div>
            <p className="pt-1 font-mono text-xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

export function CaseOverview({
    caseFile,
    personnel,
    integrity,
    timeline,
    evidenceCount,
    physicalSourceCount,
    canRegisterEvidence,
    canManageMembers,
    assignableUsers,
    caseAssignmentRoles,
}: CaseOverviewProps) {
    const { confirm } = useNotificationDialog();
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const completedStages = [Boolean(caseFile.opened_at), evidenceCount > 0, false, false, false];
    const attentionCount = integrity.verification_required + integrity.integrity_failure;

    const removeMember = async (person: CasePersonnel) => {
        if (person.assignment_id === null) {
            return;
        }

        const confirmed = await confirm({
            title: `Remove ${person.name} from this case?`,
            message: `They will lose their "${person.case_role}" role on ${caseFile.case_number}.`,
            confirmLabel: 'Remove member',
            tone: 'warning',
        });

        if (confirmed) {
            router.delete(CaseController.destroyMember({ caseFile: caseFile.case_number, assignment: person.assignment_id }).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="grid gap-5 xl:grid-cols-12">
            <div className="flex flex-col gap-5 xl:col-span-8">
                <Panel>
                    <PanelHeader
                        title="Case information"
                        description="Recorded investigation brief and scope"
                    />
                    <div className="p-5 sm:p-6">
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                            {caseFile.description || 'No case description has been recorded.'}
                        </p>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Evidence holdings"
                        description="Registered exhibits and source media attached to this case"
                        action={
                            canRegisterEvidence ? (
                                <Button size="sm" asChild>
                                    <Link href={EvidenceController.create(caseFile.case_number)}>
                                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                            add
                                        </span>
                                        Register evidence
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled
                                    title="You do not have access to register evidence on this case"
                                >
                                    Register evidence
                                </Button>
                            )
                        }
                    />
                    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryMetric label="Evidence records" value={evidenceCount} icon="inventory_2" />
                        <SummaryMetric
                            label="Source media"
                            value={physicalSourceCount}
                            icon="hard_drive"
                        />
                        <SummaryMetric
                            label="Baselines established"
                            value={integrity.baseline_established}
                            icon="fingerprint"
                        />
                        <SummaryMetric label="Needs attention" value={attentionCount} icon="warning" />
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Investigation lifecycle"
                        description="Stages reflect systems currently available in this deployment"
                    />
                    <ol className="grid gap-2 p-5 md:grid-cols-5">
                        {INVESTIGATION_STAGES.map((stage, index) => {
                            const isComplete = completedStages[index];

                            return (
                                <li
                                    key={stage.label}
                                    className={`rounded border p-3 ${
                                        isComplete
                                            ? 'border-blue-200 bg-blue-50'
                                            : 'border-slate-200 bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            aria-hidden="true"
                                            className={`material-symbols-outlined text-[18px] ${
                                                isComplete ? 'text-blue-700' : 'text-slate-400'
                                            }`}
                                        >
                                            {isComplete ? 'check_circle' : stage.icon}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            {isComplete ? 'Recorded' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="pt-3 text-xs font-semibold text-slate-700">{stage.label}</p>
                                </li>
                            );
                        })}
                    </ol>
                </Panel>
            </div>

            <aside className="flex flex-col gap-5 xl:col-span-4">
                <Panel>
                    <PanelHeader
                        title="Assigned personnel"
                        description={`${personnel.length} case assignment${personnel.length === 1 ? '' : 's'}`}
                        action={
                            canManageMembers ? (
                                <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
                                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                        person_add
                                    </span>
                                    Add member
                                </Button>
                            ) : undefined
                        }
                    />
                    <div className="flex flex-col divide-y divide-slate-100 px-5">
                        {personnel.map((person) => (
                            <div
                                key={`${person.id}-${person.case_role}`}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                                        {initials(person.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {person.name}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {person.case_role} · {person.system_role}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                            {person.assigned_at ? `Assigned ${formatDateTime(person.assigned_at)}` : 'Assignment date not recorded'}
                                            {person.assigned_by ? ` by ${person.assigned_by}` : ''}
                                        </p>
                                    </div>
                                </div>
                                {canManageMembers && person.assignment_id !== null ? (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title={`Remove ${person.name} from this case`}
                                        aria-label={`Remove ${person.name} from this case`}
                                        onClick={() => void removeMember(person)}
                                    >
                                        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-slate-400">
                                            person_remove
                                        </span>
                                    </Button>
                                ) : (
                                    <span
                                        aria-label="Identity key verification is not available"
                                        title="Identity key verification will be available in a later release"
                                        className="material-symbols-outlined text-[18px] text-slate-300"
                                    >
                                        verified_user
                                    </span>
                                )}
                            </div>
                        ))}

                        {personnel.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">
                                No personnel are assigned to this case.
                            </p>
                        ) : null}
                    </div>
                </Panel>

                {canManageMembers ? (
                    <AddMemberDialog
                        open={addMemberOpen}
                        onOpenChange={setAddMemberOpen}
                        caseNumber={caseFile.case_number}
                        assignableUsers={assignableUsers}
                        caseAssignmentRoles={caseAssignmentRoles}
                    />
                ) : null}

                <Panel>
                    <PanelHeader
                        title="Integrity status"
                        description="Current state of registered evidence"
                        action={<StatusBadge status={attentionCount > 0 ? 'VERIFICATION_REQUIRED' : 'BASELINE_ESTABLISHED'} />}
                    />
                    <dl className="grid grid-cols-2 gap-px bg-slate-200">
                        {[
                            ['Baseline', integrity.baseline_established],
                            ['Verified', integrity.verified],
                            ['Verification due', integrity.verification_required],
                            ['Failures', integrity.integrity_failure],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-white p-4">
                                <dt className="text-xs text-slate-500">{label}</dt>
                                <dd className="pt-1 font-mono text-lg font-bold text-slate-900">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
                        <span className="text-xs text-slate-500">WORM storage</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Not active
                        </span>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Recent case activity" description="Recorded case events" />
                    <ol className="flex flex-col px-5">
                        {timeline.map((entry, index) => (
                            <li key={`${entry.label}-${entry.at}`} className="relative flex gap-3 pb-4 last:pb-5">
                                {index < timeline.length - 1 ? (
                                    <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
                                ) : null}
                                <span className="relative mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-blue-700 ring-1 ring-blue-200" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{entry.label}</p>
                                    <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                                    {entry.detail ? (
                                        <p className="pt-1 text-xs leading-5 text-slate-600">{entry.detail}</p>
                                    ) : null}
                                </div>
                            </li>
                        ))}

                        {timeline.length === 0 ? (
                            <p className="pb-5 text-sm text-slate-500">No activity has been recorded.</p>
                        ) : null}
                    </ol>
                </Panel>
            </aside>
        </div>
    );
}
