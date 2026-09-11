import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { EvidenceRegistryTable } from "@/components/evidence/EvidenceRegistryTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PaginatedEvidence } from "@/types/evidence";
import { Head, Link } from "@inertiajs/react";

interface IndexProps {
    evidence: PaginatedEvidence;
    filters: {
        search: string | null;
    };
    canQuickIngest: boolean;
}

const FILTERS = [
    { label: "Integrity status", value: "All integrity states" },
    { label: "Classification", value: "All evidence types" },
    { label: "Case assignment", value: "All cases" },
    { label: "Custodian", value: "All custodians" },
    { label: "Date registered", value: "Any date" },
] as const;

function RegistryMetric({
    label,
    value,
    description,
    icon,
    tone = "slate",
}: {
    label: string;
    value: number;
    description: string;
    icon: string;
    tone?: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
    const tones = {
        slate: "bg-slate-100 text-slate-600",
        blue: "bg-blue-50 text-blue-800",
        emerald: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
    };

    return (
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {label}
                    </p>
                    <p className="pt-2 font-mono text-2xl font-bold text-slate-950">
                        {value}
                    </p>
                </div>
                <span
                    className={`flex h-9 w-9 items-center justify-center rounded ${tones[tone]}`}
                >
                    <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[20px]"
                    >
                        {icon}
                    </span>
                </span>
            </div>
            <p className="pt-2 text-xs text-slate-500">{description}</p>
        </div>
    );
}

export default function Index({
    evidence,
    filters,
    canQuickIngest,
}: IndexProps) {
    const pageCounts = evidence.data.reduce(
        (counts, item) => {
            if (item.integrity_status === "BASELINE_ESTABLISHED") {
                counts.baseline += 1;
            }

            if (item.integrity_status === "VERIFIED") {
                counts.verified += 1;
            }

            if (
                item.integrity_status === "VERIFICATION_REQUIRED" ||
                item.integrity_status === "INTEGRITY_FAILURE"
            ) {
                counts.attention += 1;
            }

            return counts;
        },
        { baseline: 0, verified: 0, attention: 0 },
    );

    return (
        <AuthenticatedLayout>
            <Head title="Evidence Registry" />

            <div className="flex flex-col gap-2">
                <PageHeader
                    eyebrow={
                        <>
                            Evidence{" "}
                            <span className="mx-1 text-slate-300">/</span>{" "}
                            Master register
                        </>
                    }
                    title="Evidence registry"
                    description="Authorised register of digital exhibits, source media, custodians, and integrity state."
                    actions={
                        <>
                            <Button
                                variant="outline"
                                disabled
                                title="Registry export will be available in a later release"
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined text-[17px]"
                                >
                                    download
                                </span>
                                Export registry
                            </Button>
                            {canQuickIngest ? (
                                <Button asChild>
                                    <Link
                                        href={EvidenceController.quickCreate()}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined text-[17px]"
                                        >
                                            add_circle
                                        </span>
                                        Quick ingest
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled>Quick ingest</Button>
                            )}
                            <Button variant="outline" asChild>
                                <Link href={CaseController.index()}>
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[17px]"
                                    >
                                        folder_open
                                    </span>
                                    Browse cases
                                </Link>
                            </Button>
                        </>
                    }
                />

                <section
                    aria-label="Evidence registry summary"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <RegistryMetric
                        label="Registered evidence"
                        value={evidence.meta.total}
                        description="All records within your authorised scope"
                        icon="inventory_2"
                        tone="slate"
                    />
                    <RegistryMetric
                        label="Baseline established"
                        value={pageCounts.baseline}
                        description="Visible on the current page"
                        icon="fingerprint"
                        tone="blue"
                    />
                    <RegistryMetric
                        label="Verified"
                        value={pageCounts.verified}
                        description="Visible on the current page"
                        icon="verified"
                        tone="emerald"
                    />
                    <RegistryMetric
                        label="Needs attention"
                        value={pageCounts.attention}
                        description="Verification due or integrity failure on this page"
                        icon="warning"
                        tone={pageCounts.attention > 0 ? "red" : "amber"}
                    />
                </section>

                <EvidenceRegistryTable
                    evidence={evidence}
                    hasSearch={Boolean(filters.search)}
                    filterPanel={
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {FILTERS.map((filter) => (
                                <label
                                    key={filter.label}
                                    className="flex flex-col gap-1.5"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        {filter.label}
                                    </span>
                                    <select
                                        disabled
                                        title={`${filter.label} filtering will be available in a later release`}
                                        className="h-9 cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400"
                                    >
                                        <option>{filter.value}</option>
                                    </select>
                                </label>
                            ))}
                        </div>
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}
