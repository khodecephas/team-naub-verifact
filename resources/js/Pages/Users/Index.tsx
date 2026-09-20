import RoleController from "@/actions/App/Http/Controllers/RoleController";
import UserController from "@/actions/App/Http/Controllers/UserController";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatRole, initials, roleAvatarClass, roleBadgeClass } from "@/lib/roles";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import type { ColumnDef } from "@tanstack/react-table";

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface UserStats {
    total: number;
    administrators: number;
    roles_in_use: number;
    added_last_30_days: number;
}

const dateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function StatCard({
    label,
    value,
    unit,
    icon,
    footer,
}: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    footer: string;
}) {
    return (
        <div className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-slate-900">{value}</span>
                        <span className="font-mono text-xs text-slate-400">{unit}</span>
                    </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-secondary">
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                        {icon}
                    </span>
                </span>
            </div>
            <div className="border-t border-slate-50 pt-2 text-xs text-slate-500">{footer}</div>
        </div>
    );
}

export default function Index({ users, stats }: { users: UserRow[]; stats: UserStats }) {
    const columns: ColumnDef<UserRow, unknown>[] = [
        {
            id: "name",
            header: "User",
            cell: ({ row }) => (
                <Link href={UserController.edit(row.original.id)} className="group flex items-center gap-3 py-0.5">
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${roleAvatarClass(row.original.role)}`}
                    >
                        {initials(row.original.name)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-secondary">
                            {row.original.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{row.original.email}</p>
                    </div>
                </Link>
            ),
        },
        {
            id: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge variant="outline" className={roleBadgeClass(row.original.role)}>
                    {formatRole(row.original.role)}
                </Badge>
            ),
        },
        {
            id: "created_at",
            header: "Created",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs text-slate-500">{dateTime(row.original.created_at)}</span>,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button size="sm" variant="outline" asChild>
                        <Link href={UserController.edit(row.original.id)}>
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                edit
                            </span>
                            Edit
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Users" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={<>Administration / Users</>}
                    title="Users"
                    description="Every account in the system. This system is admin-provisioned only — there is no public sign-up."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={RoleController.index()}>
                                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                        admin_panel_settings
                                    </span>
                                    Manage roles
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={UserController.create()}>
                                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                        person_add
                                    </span>
                                    Create user
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total accounts"
                        value={stats.total}
                        unit="USERS"
                        icon="group"
                        footer="Every provisioned account, active or not"
                    />
                    <StatCard
                        label="Administrators"
                        value={stats.administrators}
                        unit="ADMINS"
                        icon="shield_person"
                        footer="Hold every permission by default"
                    />
                    <StatCard
                        label="Roles in use"
                        value={stats.roles_in_use}
                        unit="ROLES"
                        icon="admin_panel_settings"
                        footer="Distinct roles assigned to at least one user"
                    />
                    <StatCard
                        label="New accounts"
                        value={stats.added_last_30_days}
                        unit="LAST 30D"
                        icon="person_add"
                        footer="Provisioned in the last 30 days"
                    />
                </div>

                <DataTable
                    title="All users"
                    description={`${users.length} account${users.length === 1 ? "" : "s"}`}
                    columns={columns}
                    data={users}
                    searchText="Search name, email, or role…"
                    searchAccessor={(item) => `${item.name} ${item.email} ${item.role}`}
                    getRowId={(item) => String(item.id)}
                    emptyMessage="No users found."
                />
            </div>
        </AuthenticatedLayout>
    );
}
