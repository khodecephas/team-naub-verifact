import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { router, usePage } from "@inertiajs/react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

interface DataTablePaginate {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Laravel paginator meta, as returned by e.g. EvidenceResource::collection($paginator). */
    paginate?: DataTablePaginate;
    searchText?: string;
    hideSearch?: boolean;
    title?: string;
    description?: string;
    headerAction?: ReactNode;
    /** Compact controls, such as list/grid view buttons, rendered beside search. */
    filterTrigger?: ReactNode;
    /** Full-width structured filters rendered below the search toolbar. */
    filterPanel?: ReactNode;
    /** Optional selection or batch-action bar rendered above the rows. */
    bulkActions?: ReactNode;
    /** Enables useful search for non-paginated client-side tables. */
    searchAccessor?: (row: TData) => string;
    rowClassName?: (row: TData) => string | undefined;
    getRowId?: (row: TData) => string;
    emptyMessage?: string;
}

/**
 * Render a consistent registry shell with TanStack columns, optional Laravel
 * pagination, server or client search, filters, view controls, and bulk actions.
 */
export function DataTable<TData, TValue>({
    columns,
    data,
    paginate,
    searchText,
    hideSearch = false,
    title,
    description,
    headerAction,
    filterTrigger,
    filterPanel,
    bulkActions,
    searchAccessor,
    rowClassName,
    getRowId,
    emptyMessage = "No results found.",
}: DataTableProps<TData, TValue>) {
    const { url } = usePage();
    const basePath = url.split("?")[0];
    const currentParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
    );
    const [searchValue, setSearchValue] = useState(
        currentParams.get("search") ?? "",
    );

    const navigate = (
        overrides: Record<string, string | number | undefined>,
    ) => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );

        Object.entries(overrides).forEach(([key, value]) => {
            if (value === undefined || value === "") {
                delete params[key];
            } else {
                params[key] = String(value);
            }
        });

        router.get(basePath, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);

        if (searchAccessor) {
            return;
        }

        navigate({ search: value || undefined, page: undefined });
    };

    const clearSearch = () => {
        setSearchValue("");
        if (!searchAccessor) {
            navigate({ search: undefined, page: undefined });
        }
    };

    const handlePageChange = (page: number) => {
        navigate({ page });
    };

    const visibleData =
        searchAccessor && searchValue.trim()
            ? data.filter((row) =>
                  searchAccessor(row)
                      .toLowerCase()
                      .includes(searchValue.trim().toLowerCase()),
              )
            : data;
    const table = useReactTable({
        data: visibleData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId,
    });

    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            {(title || description || headerAction) && (
                <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
                    <div>
                        {title && (
                            <h2 className="text-sm font-bold text-slate-900">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-1 text-xs text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>
                    {headerAction}
                </div>
            )}

            {(!hideSearch || filterTrigger || filterPanel) && (
                <div className="flex flex-col gap-2 border-b border-slate-200 p-3">
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        {!hideSearch ? (
                            <div className="relative w-full max-w-sm">
                                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                                    search
                                </span>
                                <Input
                                    placeholder={
                                        searchText ?? "Search records…"
                                    }
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                    className="h-9 pl-9 pr-9 shadow-sm"
                                />
                                {searchValue && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Clear search"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            close
                                        </span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div />
                        )}
                        {filterTrigger && (
                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                {filterTrigger}
                            </div>
                        )}
                    </div>
                    {filterPanel}
                </div>
            )}

            {bulkActions}

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {visibleData.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={rowClassName?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="py-6 text-center text-sm text-slate-500"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {paginate && paginate.last_page > 1 && (
                <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 sm:flex-row">
                    <p className="text-xs text-slate-500">
                        Showing{" "}
                        <span className="font-medium text-slate-900">
                            {data.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-slate-900">
                            {paginate.total}
                        </span>
                    </p>

                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent className="gap-1">
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    className={cn(
                                        paginate.current_page <= 1 &&
                                            "pointer-events-none opacity-40",
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (paginate.current_page > 1)
                                            handlePageChange(
                                                paginate.current_page - 1,
                                            );
                                    }}
                                />
                            </PaginationItem>

                            {paginate.links
                                .filter(
                                    (link) =>
                                        !link.label.includes("Previous") &&
                                        !link.label.includes("Next"),
                                )
                                .map((link, i) => {
                                    const isPageNum = !Number.isNaN(
                                        Number(link.label),
                                    );

                                    return (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                isActive={link.active}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (isPageNum)
                                                        handlePageChange(
                                                            parseInt(
                                                                link.label,
                                                                10,
                                                            ),
                                                        );
                                                }}
                                            >
                                                {link.label}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    className={cn(
                                        paginate.current_page >=
                                            paginate.last_page &&
                                            "pointer-events-none opacity-40",
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (
                                            paginate.current_page <
                                            paginate.last_page
                                        ) {
                                            handlePageChange(
                                                paginate.current_page + 1,
                                            );
                                        }
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
