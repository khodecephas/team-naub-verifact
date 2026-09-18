import CaseController from "@/actions/App/Http/Controllers/CaseController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { EvidenceRegistryTable } from "@/components/evidence/EvidenceRegistryTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PaginatedEvidence } from "@/types/evidence";
import { Head, Link, router, usePage } from "@inertiajs/react";

interface IndexProps {
    evidence: PaginatedEvidence;
    filters: {
        search?: string;
        integrity?: string;
        type?: string;
        case?: string;
        custodian?: string;
        registered?: string;
    };
    filterOptions: {
        integrity: string[];
        types: string[];
        cases: { id: number; case_number: string; title: string }[];
        custodians: { id: number; name: string }[];
    };
    canQuickIngest: boolean;
}

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
    filterOptions,
    canQuickIngest,
}: IndexProps) {
    const { url } = usePage();
    const currentQuery = url.includes("?") ? `?${url.split("?")[1]}` : "";
    const setFilter = (key: string, value: string) => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );

        if (value) params[key] = value;
        else delete params[key];
        delete params.page;

        router.get(EvidenceController.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
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
                            <Button variant="outline" asChild>
                                <a
                                    href={`${EvidenceController.export().url}${currentQuery}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="material-symbols-outlined text-[17px]"
                                    >
                                        download
                                    </span>
                                    Export registry
                                </a>
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
                            <RegistryFilter label="Integrity status" value={filters.integrity} onChange={(value) => setFilter("integrity", value)} options={[["", "All integrity states"], ...filterOptions.integrity.map((value) => [value, value.replaceAll("_", " ")])]} />
                            <RegistryFilter label="Classification" value={filters.type} onChange={(value) => setFilter("type", value)} options={[["", "All evidence types"], ...filterOptions.types.map((value) => [value, value.replaceAll("_", " ")])]} />
                            <RegistryFilter label="Case assignment" value={filters.case} onChange={(value) => setFilter("case", value)} options={[["", "All cases"], ["unassigned", "Unassigned"], ...filterOptions.cases.map((item) => [item.case_number, `${item.case_number} — ${item.title}`])]} />
                            <RegistryFilter label="Custodian" value={filters.custodian} onChange={(value) => setFilter("custodian", value)} options={[["", "All custodians"], ...filterOptions.custodians.map((item) => [String(item.id), item.name])]} />
                            <RegistryFilter label="Date registered" value={filters.registered} onChange={(value) => setFilter("registered", value)} options={[["", "Any date"], ["today", "Today"], ["week", "Last 7 days"], ["month", "Last 30 days"]]} />
                        </div>
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}

function RegistryFilter({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: string[][];
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </span>
            <select
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}
