import EvidenceController from '@/actions/App/Http/Controllers/EvidenceController';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PaginatedEvidence } from '@/types/evidence';
import { Head, Link } from '@inertiajs/react';

export default function Index({ evidence }: { evidence: PaginatedEvidence }) {
    return (
        <AuthenticatedLayout>
            <Head title="Evidence" />

            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex flex-col gap-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Evidence</h1>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Evidence #</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Case</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Integrity Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evidence.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Link
                                                href={EvidenceController.show(item.evidence_number)}
                                                className="font-mono text-xs font-semibold text-secondary hover:underline"
                                            >
                                                {item.evidence_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-900">{item.title}</TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {item.case?.case_number ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">{item.evidence_type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.integrity_status.replace(/_/g, ' ')}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {evidence.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                                            No evidence registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
