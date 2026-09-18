import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import ReportController from "@/actions/App/Http/Controllers/ReportController";
import SearchController from "@/actions/App/Http/Controllers/SearchController";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";

interface SearchItem {
    title: string;
    status?: string;
    integrity_status?: string;
    case_number?: string;
    evidence_number?: string;
    report_number?: string;
    original_filename?: string;
}

interface Props {
    query: string;
    cases: SearchItem[];
    evidence: SearchItem[];
    reports: SearchItem[];
}

export default function Index({ query, cases, evidence, reports }: Props) {
    const [value, setValue] = useState(query);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(SearchController.index().url, { q: value.trim() });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Search" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow="System search"
                    title="Search records"
                    description="Search authorized cases, evidence, filenames, fingerprints, and reports."
                />
                <form onSubmit={submit} className="flex gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="Case ID, evidence ID, filename, fingerprint, or report…"
                        className="h-10 min-w-0 flex-1 rounded-md border-slate-300 text-sm"
                        autoFocus
                    />
                    <Button type="submit">Search</Button>
                </form>
                <div className="grid gap-4 xl:grid-cols-3">
                    <ResultPanel title="Cases" items={cases} identifier="case_number" />
                    <ResultPanel title="Evidence" items={evidence} identifier="evidence_number" />
                    <ResultPanel title="Reports" items={reports} identifier="report_number" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ResultPanel({
    title,
    items,
    identifier,
}: {
    title: string;
    items: SearchItem[];
    identifier: "case_number" | "evidence_number" | "report_number";
}) {
    return (
        <Panel>
            <PanelHeader title={title} description={`${items.length} result${items.length === 1 ? "" : "s"}`} />
            <div className="divide-y divide-slate-100">
                {items.map((item) => {
                    const number = item[identifier] as string;

                    return (
                        <Link
                            key={number}
                            href={resultUrl(identifier, number)}
                            className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                        >
                            <span className="min-w-0">
                                <strong className="font-mono text-xs text-secondary">{number}</strong>
                                <span className="mt-1 block truncate text-sm font-semibold text-slate-800">{item.title}</span>
                                {item.original_filename ? (
                                    <span className="mt-1 block truncate text-xs text-slate-500">{item.original_filename}</span>
                                ) : null}
                            </span>
                            <StatusBadge status={item.status ?? item.integrity_status ?? ""} />
                        </Link>
                    );
                })}
                {items.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No matching {title.toLowerCase()}.</p>
                ) : null}
            </div>
        </Panel>
    );
}

function resultUrl(
    identifier: "case_number" | "evidence_number" | "report_number",
    number: string,
): string {
    if (identifier === "case_number") {
        return CaseController.show(number).url;
    }

    if (identifier === "evidence_number") {
        return EvidenceController.show(number).url;
    }

    return ReportController.show(number).url;
}
