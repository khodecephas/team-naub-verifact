import RoleController from "@/actions/App/Http/Controllers/RoleController";
import UserController from "@/actions/App/Http/Controllers/UserController";
import InputError from "@/Components/InputError";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatRole, initials, permissionLabel, roleAvatarClass, roleBadgeClass, roleIcon } from "@/lib/roles";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEvent } from "react";

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface EditProps {
    user: UserData;
    roles: string[];
    rolePermissions: Record<string, string[]>;
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            {label}
            {children}
            <InputError message={error} />
        </label>
    );
}

export default function Edit({ user, roles, rolePermissions }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
        password_confirmation: "",
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(UserController.update(user.id).url);
    };

    const selectedPermissions = rolePermissions[data.role] ?? [];
    const roleChanged = data.role !== user.role;

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${user.name}`} />
            <div className="flex flex-col gap-4">
                <PageHeader
                    eyebrow={
                        <>
                            <Link href={UserController.index()} className="hover:text-slate-900">
                                Users
                            </Link>
                            <span className="mx-1 text-slate-300">/</span>Edit
                        </>
                    }
                    title={
                        <span className="flex items-center gap-3">
                            <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${roleAvatarClass(user.role)}`}
                            >
                                {initials(user.name)}
                            </span>
                            {user.name}
                        </span>
                    }
                    description="Update this account's details or role."
                />

                <form onSubmit={submit} className="grid max-w-4xl gap-4 lg:grid-cols-3">
                    <Panel className="lg:col-span-2">
                        <PanelHeader
                            title={
                                <span className="flex items-center gap-2">
                                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-slate-400">
                                        edit
                                    </span>
                                    Account details
                                </span>
                            }
                        />
                        <div className="grid gap-5 p-5 sm:p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Full name" error={errors.name}>
                                    <Input
                                        value={data.name}
                                        onChange={(event) => setData("name", event.target.value)}
                                        required
                                        className="h-10 font-normal"
                                    />
                                </Field>

                                <Field label="Email" error={errors.email}>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData("email", event.target.value)}
                                        required
                                        className="h-10 font-normal"
                                    />
                                </Field>
                            </div>

                            <Field label="Role" error={errors.role}>
                                <select
                                    value={data.role}
                                    onChange={(event) => setData("role", event.target.value)}
                                    className="h-10 rounded-md border border-border bg-white px-3 text-sm font-normal text-foreground shadow-sm focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {formatRole(role)}
                                        </option>
                                    ))}
                                </select>
                                {roleChanged && (
                                    <span className="flex items-center gap-1 text-[11px] font-normal normal-case text-amber-600">
                                        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                                            info
                                        </span>
                                        This changes what {user.name} can access immediately on save.
                                    </span>
                                )}
                            </Field>

                            <div className="border-t border-slate-200 pt-5">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-slate-400">
                                        lock_reset
                                    </span>
                                    Reset password (optional)
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Leave blank to keep the current password.</p>
                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                    <Field label="New password" error={errors.password}>
                                        <Input
                                            type="password"
                                            value={data.password}
                                            onChange={(event) => setData("password", event.target.value)}
                                            className="h-10 font-normal"
                                        />
                                    </Field>
                                    <Field label="Confirm new password">
                                        <Input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(event) => setData("password_confirmation", event.target.value)}
                                            className="h-10 font-normal"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href={UserController.index()}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Saving…" : "Save changes"}
                            </Button>
                        </div>
                    </Panel>

                    <Panel className="h-fit">
                        <PanelHeader
                            title={
                                <span className="flex items-center gap-2">
                                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-slate-400">
                                        {roleIcon(data.role)}
                                    </span>
                                    Role preview
                                </span>
                            }
                            description="What this account can do with the selected role."
                        />
                        <div className="flex flex-col gap-3 p-5">
                            <Badge variant="outline" className={`w-fit ${roleBadgeClass(data.role)}`}>
                                {formatRole(data.role || "—")}
                            </Badge>
                            {selectedPermissions.length > 0 ? (
                                <ul className="flex flex-col gap-1.5">
                                    {selectedPermissions.map((permission) => (
                                        <li key={permission} className="flex items-center gap-1.5 text-xs text-slate-600">
                                            <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-emerald-600">
                                                check_circle
                                            </span>
                                            <span className="capitalize">{permissionLabel(permission)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs italic text-slate-400">This role currently grants no permissions.</p>
                            )}
                            <p className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                                Permissions are configured on the{" "}
                                <Link href={RoleController.index()} className="underline">
                                    Roles
                                </Link>{" "}
                                screen and apply to every user with this role.
                            </p>
                        </div>
                    </Panel>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
