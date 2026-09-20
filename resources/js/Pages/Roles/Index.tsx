import RoleController from "@/actions/App/Http/Controllers/RoleController";
import UserController from "@/actions/App/Http/Controllers/UserController";
import { useNotificationDialog } from "@/components/notifications/NotificationDialogProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { groupPermissions, permissionLabel, roleBadgeClass, roleIcon } from "@/lib/roles";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";

interface RoleRow {
    id: number;
    name: string;
    is_system_role: boolean;
    user_count: number;
    permissions: string[];
}

interface RoleStats {
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    total_permissions: number;
}

function StatCard({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
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
    );
}

function PermissionChip({
    permission,
    checked,
    onToggle,
}: {
    permission: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium capitalize transition-colors",
                checked
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
        >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                {checked ? "check_box" : "check_box_outline_blank"}
            </span>
            {permissionLabel(permission)}
        </button>
    );
}

function PermissionPicker({
    allPermissions,
    selected,
    onToggle,
}: {
    allPermissions: string[];
    selected: Set<string>;
    onToggle: (permission: string) => void;
}) {
    const groups = groupPermissions(allPermissions);

    return (
        <div className="flex flex-col gap-4">
            {Object.entries(groups).map(([group, permissions]) => (
                <div key={group}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {permissions.map((permission) => (
                            <PermissionChip
                                key={permission}
                                permission={permission}
                                checked={selected.has(permission)}
                                onToggle={() => onToggle(permission)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function RolePanel({ role, allPermissions }: { role: RoleRow; allPermissions: string[] }) {
    const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));
    const [saving, setSaving] = useState(false);
    const { confirm, notify } = useNotificationDialog();
    const dirty =
        selected.size !== role.permissions.length || role.permissions.some((permission) => !selected.has(permission));

    const toggle = (permission: string) => {
        setSelected((current) => {
            const next = new Set(current);
            next.has(permission) ? next.delete(permission) : next.add(permission);

            return next;
        });
    };

    const save = () => {
        router.patch(
            RoleController.update(role.id).url,
            { permissions: Array.from(selected) },
            { preserveScroll: true, onStart: () => setSaving(true), onFinish: () => setSaving(false) },
        );
    };

    const remove = async () => {
        const confirmed = await confirm({
            title: `Delete the ${role.name} role?`,
            message: "This can only be done while no user currently holds this role. This cannot be undone.",
            confirmLabel: "Delete role",
            tone: "error",
        });

        if (!confirmed) {
            return;
        }

        router.delete(RoleController.destroy(role.id).url, {
            onError: (errors) =>
                notify({ title: "Could not delete role", message: Object.values(errors)[0] ?? "", tone: "error" }),
        });
    };

    return (
        <Panel>
            <PanelHeader
                title={
                    <span className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[16px] text-slate-400"
                        >
                            {roleIcon(role.name)}
                        </span>
                        {role.name}
                        <Badge variant="outline" className={cn("normal-case", roleBadgeClass(role.name))}>
                            {role.is_system_role ? "Built-in" : "Custom"}
                        </Badge>
                    </span>
                }
                description={`${role.user_count} user${role.user_count === 1 ? "" : "s"} currently hold this role`}
                action={
                    !role.is_system_role ? (
                        <Button size="sm" variant="outline" onClick={() => void remove()}>
                            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                                delete
                            </span>
                            Delete
                        </Button>
                    ) : undefined
                }
            />
            <div className="p-5">
                <PermissionPicker allPermissions={allPermissions} selected={selected} onToggle={toggle} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <span className="text-xs text-slate-400">
                    {selected.size} of {allPermissions.length} permissions granted
                </span>
                <Button size="sm" onClick={save} disabled={!dirty || saving}>
                    {saving ? "Saving…" : "Save permissions"}
                </Button>
            </div>
        </Panel>
    );
}

function CreateRoleDialog({
    open,
    onOpenChange,
    allPermissions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allPermissions: string[];
}) {
    const [name, setName] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);

    const toggle = (permission: string) => {
        setSelected((current) => {
            const next = new Set(current);
            next.has(permission) ? next.delete(permission) : next.add(permission);

            return next;
        });
    };

    const slug = name.trim().toUpperCase().replace(/\s+/g, "_");

    const submit = () => {
        router.post(
            RoleController.store().url,
            { name: slug, permissions: Array.from(selected) },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setName("");
                    setSelected(new Set());
                    onOpenChange(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create a custom role</DialogTitle>
                    <DialogDescription>
                        Adds a new role beyond the built-in seven, assignable from a user's edit page.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-5">
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Role name
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Field Agent"
                            className="h-10 font-normal"
                        />
                        {name.trim() && <span className="font-mono text-[11px] font-normal normal-case text-slate-400">Saved as {slug}</span>}
                    </label>
                    <div>
                        <p className="mb-2 text-xs font-semibold text-slate-700">Permissions</p>
                        <PermissionPicker allPermissions={allPermissions} selected={selected} onToggle={toggle} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!name.trim() || processing}>
                        {processing ? "Creating…" : "Create role"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Index({
    roles,
    permissions,
    stats,
}: {
    roles: RoleRow[];
    permissions: string[];
    stats: RoleStats;
}) {
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Roles & Permissions" />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={<>Administration / Roles</>}
                    title="Roles & permissions"
                    description="Every policy that used to hardcode which roles can do what now reads this mapping instead."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={UserController.index()}>
                                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                        group
                                    </span>
                                    Manage users
                                </Link>
                            </Button>
                            <Button onClick={() => setCreateOpen(true)}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                    add
                                </span>
                                Create role
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total roles" value={stats.total_roles} unit="ROLES" icon="admin_panel_settings" />
                    <StatCard label="Built-in roles" value={stats.system_roles} unit="SYSTEM" icon="verified_user" />
                    <StatCard label="Custom roles" value={stats.custom_roles} unit="CUSTOM" icon="tune" />
                    <StatCard label="Permissions" value={stats.total_permissions} unit="TOTAL" icon="key" />
                </div>

                <div className="flex flex-col gap-5">
                    {roles.map((role) => (
                        <RolePanel key={role.id} role={role} allPermissions={permissions} />
                    ))}
                </div>

                <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} allPermissions={permissions} />
            </div>
        </AuthenticatedLayout>
    );
}
