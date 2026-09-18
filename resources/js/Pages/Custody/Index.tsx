import CustodyRequestController from "@/actions/App/Http/Controllers/CustodyRequestController";
import CustodyController from "@/actions/App/Http/Controllers/CustodyController";
import EvidenceController from "@/actions/App/Http/Controllers/EvidenceController";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface Holding {
    evidence_number: string;
    title: string;
    case_number: string | null;
    location: string | null;
    since: string;
    chain_verified: boolean;
}
interface RequestItem {
    id: number;
    evidence_number: string;
    evidence_title: string;
    requester: string;
    current_custodian: string;
    purpose: string;
    requested_location: string | null;
    status: string;
    reviewer: string | null;
    review_notes: string | null;
    created_at: string;
    can_review: boolean;
    can_cancel: boolean;
}
interface HistoryItem {
    id: number;
    evidence_number: string;
    evidence_title: string;
    from_custodian: string | null;
    to_custodian: string;
    performed_by: string;
    purpose: string;
    from_location: string | null;
    to_location: string | null;
    method: string;
    occurred_at: string;
}
type Tab = "current" | "requests" | "history";

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export default function Index({
    holdings,
    requests,
    history,
    caseFilter,
}: {
    holdings: Holding[];
    requests: RequestItem[];
    history: HistoryItem[];
    caseFilter: string | null;
}) {
    const [tab, setTab] = useState<Tab>("current");
    const [reviewing, setReviewing] = useState<RequestItem | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [processing, setProcessing] = useState(false);
    const pending = requests.filter((item) => item.status === "PENDING").length;
    const awaitingReview = requests.filter(
        (item) => item.status === "PENDING" && item.can_review,
    ).length;
    const verifiedHoldings = holdings.filter(
        (item) => item.chain_verified,
    ).length;

    const act = (decision: "approve" | "reject") => {
        if (!reviewing) return;
        const url =
            decision === "approve"
                ? CustodyRequestController.approve(reviewing.id).url
                : CustodyRequestController.reject(reviewing.id).url;
        router.post(
            url,
            { review_notes: reviewNotes },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setReviewing(null);
                    setReviewNotes("");
                },
            },
        );
    };

    const tabs: { value: Tab; label: string; icon: string; count: number }[] = [
        {
            value: "current",
            label: "Current custody",
            icon: "inventory_2",
            count: holdings.length,
        },
        {
            value: "requests",
            label: "Requests",
            icon: "pending_actions",
            count: pending,
        },
        {
            value: "history",
            label: "History",
            icon: "history",
            count: history.length,
        },
    ];
    const tabControls = (
        <div className="flex gap-1 overflow-x-auto rounded-md bg-slate-100 p-1">
            {tabs.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => setTab(item.value)}
                    className={`flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${tab === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <span
                        className={`material-symbols-outlined text-[17px] ${tab === item.value ? "text-secondary" : "text-slate-400"}`}
                    >
                        {item.icon}
                    </span>
                    {item.label}
                    <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${tab === item.value ? "bg-blue-50 text-blue-800" : "bg-slate-200 text-slate-500"}`}
                    >
                        {item.count}
                    </span>
                </button>
            ))}
        </div>
    );
    const holdingColumns: ColumnDef<Holding, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[220px]">
                    <Link
                        href={EvidenceController.show(
                            row.original.evidence_number,
                        )}
                        className="font-mono text-xs font-bold text-secondary hover:underline"
                    >
                        {row.original.evidence_number}
                    </Link>
                    <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-800">
                        {row.original.title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "case_number",
            header: "Case",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600">
                    {row.original.case_number ?? "Unassigned"}
                </span>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ row }) => (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                        location_on
                    </span>
                    {row.original.location ?? "Not recorded"}
                </span>
            ),
        },
        {
            accessorKey: "since",
            header: "Custody since",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {dateTime(row.original.since)}
                </span>
            ),
        },
        {
            accessorKey: "chain_verified",
            header: "Chain status",
            cell: ({ row }) => (
                <StatusBadge
                    status={
                        row.original.chain_verified
                            ? "VERIFIED"
                            : "INTEGRITY_FAILURE"
                    }
                />
            ),
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="text-right">
                    <Button size="sm" variant="outline" asChild>
                        <Link
                            href={EvidenceController.show(
                                row.original.evidence_number,
                            )}
                        >
                            View record
                            <span className="material-symbols-outlined text-[15px]">
                                arrow_forward
                            </span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];
    const requestColumns: ColumnDef<RequestItem, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[210px]">
                    <div className="flex items-center gap-2">
                        <Link
                            href={EvidenceController.show(
                                row.original.evidence_number,
                            )}
                            className="font-mono text-xs font-bold text-secondary hover:underline"
                        >
                            {row.original.evidence_number}
                        </Link>
                        <StatusBadge status={row.original.status} />
                    </div>
                    <p className="mt-1 max-w-xs truncate text-sm font-semibold text-slate-800">
                        {row.original.evidence_title}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "requester",
            header: "Request",
            cell: ({ row }) => (
                <div className="min-w-[260px]">
                    <p className="text-sm text-slate-700">
                        <strong>{row.original.requester}</strong> requested
                        custody from {row.original.current_custodian}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {row.original.purpose}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "requested_location",
            header: "Requested location",
            cell: ({ row }) => (
                <span className="text-xs text-slate-500">
                    {row.original.requested_location ?? "No location specified"}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Requested",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {dateTime(row.original.created_at)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    {row.original.can_review && (
                        <Button
                            size="sm"
                            onClick={() => setReviewing(row.original)}
                        >
                            Review request
                        </Button>
                    )}
                    {row.original.can_cancel && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    CustodyRequestController.cancel(
                                        row.original.id,
                                    ).url,
                                )
                            }
                        >
                            Cancel
                        </Button>
                    )}
                    {!row.original.can_review && !row.original.can_cancel && (
                        <span className="text-xs text-slate-400">
                            No action required
                        </span>
                    )}
                </div>
            ),
        },
    ];
    const historyColumns: ColumnDef<HistoryItem, unknown>[] = [
        {
            accessorKey: "evidence_number",
            header: "Evidence",
            cell: ({ row }) => (
                <div className="min-w-[190px]">
                    <Link
                        href={EvidenceController.show(
                            row.original.evidence_number,
                        )}
                        className="font-mono text-xs font-bold text-secondary hover:underline"
                    >
                        {row.original.evidence_number}
                    </Link>
                    <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                        {row.original.evidence_title}
                    </p>
                </div>
            ),
        },
        {
            id: "handoff",
            header: "Handoff",
            cell: ({ row }) => (
                <div className="min-w-[240px]">
                    <p className="text-sm font-semibold text-slate-800">
                        {row.original.from_custodian ?? "Initial intake"}{" "}
                        <span className="mx-1 text-slate-300">→</span>{" "}
                        {row.original.to_custodian}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Recorded by {row.original.performed_by}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => (
                <span className="block max-w-xs whitespace-normal text-sm text-slate-600">
                    {row.original.purpose}
                </span>
            ),
        },
        {
            id: "location",
            header: "Location",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {row.original.from_location ?? "Unrecorded"} →{" "}
                    {row.original.to_location ?? "Unrecorded"}
                </span>
            ),
        },
        {
            accessorKey: "occurred_at",
            header: "Recorded",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {dateTime(row.original.occurred_at)}
                </span>
            ),
        },
        {
            accessorKey: "method",
            header: "Method",
            cell: ({ row }) => (
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {row.original.method.replace(/_/g, " ")}
                </span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Chain of Custody" />
            <div className="flex flex-col gap-2">
                <PageHeader
                    eyebrow={
                        <>
                            Custody{" "}
                            <span className="mx-1 text-slate-300">/</span>{" "}
                            Responsibility register
                        </>
                    }
                    title="Chain of custody"
                    description="Manage evidence responsibility, review transfer requests, and inspect every recorded handoff."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={EvidenceController.index()}>
                                <span className="material-symbols-outlined text-[17px]">
                                    inventory_2
                                </span>
                                Browse evidence
                            </Link>
                        </Button>
                    }
                />

                {caseFilter ? (
                    <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
                        <span>
                            Showing custody records for{" "}
                            <strong className="font-mono">{caseFilter}</strong>
                        </span>
                        <Button size="sm" variant="ghost" asChild>
                            <Link href={CustodyController.index()}>
                                Clear case filter
                            </Link>
                        </Button>
                    </div>
                ) : null}

                <section
                    aria-label="Custody summary"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <Metric
                        label="In your custody"
                        value={holdings.length}
                        detail="Evidence currently assigned to you"
                        icon="person_pin_circle"
                    />
                    <Metric
                        label="Awaiting your review"
                        value={awaitingReview}
                        detail="Requests requiring a decision"
                        icon="approval_delegation"
                        tone={awaitingReview > 0 ? "amber" : "slate"}
                    />
                    <Metric
                        label="Open requests"
                        value={pending}
                        detail="Pending requests within your scope"
                        icon="pending_actions"
                        tone="blue"
                    />
                    <Metric
                        label="Verified chains"
                        value={verifiedHoldings}
                        detail={
                            holdings.length === verifiedHoldings
                                ? "All current holdings are consistent"
                                : "One or more holdings need review"
                        }
                        icon="verified_user"
                        tone={
                            holdings.length === verifiedHoldings
                                ? "emerald"
                                : "red"
                        }
                    />
                </section>

                {tab === "current" && (
                    <DataTable
                        title="Evidence in your custody"
                        description="Authoritative responsibility and recorded storage location"
                        columns={holdingColumns}
                        data={holdings}
                        searchText="Search evidence, case, or location…"
                        searchAccessor={(item) =>
                            `${item.evidence_number} ${item.title} ${item.case_number ?? ""} ${item.location ?? ""}`
                        }
                        filterTrigger={tabControls}
                        emptyMessage="No evidence in your custody."
                        getRowId={(item) => item.evidence_number}
                    />
                )}
                {tab === "requests" && (
                    <DataTable
                        title="Custody requests"
                        description="Requests you submitted or are authorised to review"
                        columns={requestColumns}
                        data={requests}
                        searchText="Search evidence, requester, custodian, or purpose…"
                        searchAccessor={(item) =>
                            `${item.evidence_number} ${item.evidence_title} ${item.requester} ${item.current_custodian} ${item.purpose} ${item.status}`
                        }
                        filterTrigger={tabControls}
                        emptyMessage="No custody requests match this search."
                        getRowId={(item) => String(item.id)}
                    />
                )}
                {tab === "history" && (
                    <DataTable
                        title="Recorded custody history"
                        description="Permanent handoffs across evidence visible to you"
                        headerAction={
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">
                                    lock
                                </span>
                                Append-only record
                            </span>
                        }
                        columns={historyColumns}
                        data={history}
                        searchText="Search evidence, custodian, purpose, or location…"
                        searchAccessor={(item) =>
                            `${item.evidence_number} ${item.evidence_title} ${item.from_custodian ?? ""} ${item.to_custodian} ${item.performed_by} ${item.purpose} ${item.from_location ?? ""} ${item.to_location ?? ""}`
                        }
                        filterTrigger={tabControls}
                        emptyMessage="No custody history matches this search."
                        getRowId={(item) => String(item.id)}
                    />
                )}

                <Dialog
                    open={reviewing !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setReviewing(null);
                            setReviewNotes("");
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review custody request</DialogTitle>
                            <DialogDescription>
                                Confirm whether responsibility for this evidence
                                should move to the requester.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 p-5">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                <p className="font-mono text-xs font-bold text-secondary">
                                    {reviewing?.evidence_number}
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {reviewing?.evidence_title}
                                </p>
                                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                                    <div>
                                        <dt className="text-slate-500">
                                            Requester
                                        </dt>
                                        <dd className="mt-1 font-semibold text-slate-800">
                                            {reviewing?.requester}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500">
                                            Requested location
                                        </dt>
                                        <dd className="mt-1 font-semibold text-slate-800">
                                            {reviewing?.requested_location ??
                                                "No location specified"}
                                        </dd>
                                    </div>
                                </dl>
                                <p className="mt-4 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">
                                    {reviewing?.purpose}
                                </p>
                            </div>
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Review notes
                                <textarea
                                    rows={3}
                                    value={reviewNotes}
                                    onChange={(event) =>
                                        setReviewNotes(event.target.value)
                                    }
                                    placeholder="Add context for the decision"
                                    className="rounded-md border-slate-300 text-sm font-normal"
                                />
                            </label>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                disabled={processing}
                                onClick={() => act("reject")}
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    close
                                </span>
                                Reject
                            </Button>
                            <Button
                                disabled={processing}
                                onClick={() => act("approve")}
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    check
                                </span>
                                {processing
                                    ? "Saving…"
                                    : "Approve and transfer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({
    label,
    value,
    detail,
    icon,
    tone = "slate",
}: {
    label: string;
    value: number;
    detail: string;
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
                    <span className="material-symbols-outlined text-[20px]">
                        {icon}
                    </span>
                </span>
            </div>
            <p className="pt-2 text-xs text-slate-500">{detail}</p>
        </div>
    );
}
