import { StatusBadge } from '@/components/ui/status-badge';

export function ReportStatusBadge({ status }: { status: string }) {
    return <StatusBadge status={status} />;
}
