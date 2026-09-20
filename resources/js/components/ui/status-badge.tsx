import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
    OPEN: 'border-blue-200 bg-blue-50 text-blue-800',
    IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800',
    CLOSED: 'border-slate-300 bg-slate-100 text-slate-700',
    ARCHIVED: 'border-slate-300 bg-slate-100 text-slate-600',
    BASELINE_ESTABLISHED: 'border-blue-200 bg-blue-50 text-blue-800',
    VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    VERIFICATION_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-800',
    INTEGRITY_FAILURE: 'border-red-200 bg-red-50 text-red-800',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    REJECTED: 'border-red-200 bg-red-50 text-red-800',
    CANCELLED: 'border-slate-300 bg-slate-100 text-slate-600',
    DRAFT: 'border-amber-200 bg-amber-50 text-amber-800',
    FINAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    SUPERSEDED: 'border-slate-300 bg-slate-100 text-slate-600',
    SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    HASH_MISMATCH: 'border-red-200 bg-red-50 text-red-800',
    UNAUTHORIZED: 'border-red-200 bg-red-50 text-red-800',
    ERROR: 'border-red-200 bg-red-50 text-red-800',
};

const icons: Record<string, string> = {
    OPEN: 'radio_button_checked',
    IN_PROGRESS: 'pending',
    CLOSED: 'check_circle',
    ARCHIVED: 'archive',
    BASELINE_ESTABLISHED: 'fingerprint',
    VERIFIED: 'verified',
    VERIFICATION_REQUIRED: 'schedule',
    INTEGRITY_FAILURE: 'warning',
    DRAFT: 'edit_document',
    FINAL: 'verified',
    SUPERSEDED: 'history',
    SUCCESS: 'verified',
    HASH_MISMATCH: 'gpp_bad',
    UNAUTHORIZED: 'block',
    ERROR: 'error',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]', styles[status] ?? 'border-slate-200 bg-slate-50 text-slate-700', className)}>
            {icons[status] && <span aria-hidden="true" className="material-symbols-outlined text-[13px]">{icons[status]}</span>}
            {status.replace(/_/g, ' ')}
        </span>
    );
}
