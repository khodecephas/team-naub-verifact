import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import IconTextField from '@/Components/Auth/IconTextField';
import PasswordField from '@/Components/Auth/PasswordField';
import { Button } from '@/components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

/**
 * Credentials-only by request — the source Stitch design's SmartCard/PIV
 * and Agency SSO tabs were removed entirely rather than kept disabled,
 * since there's only one login method. Also dropped from the source: the
 * "Hardware Security Token Detected / Ready" badge and the "Live Node
 * Status" card (14 Vault Nodes Synced / TLS 1.3), both fabricated
 * real-time status with nothing behind them, and a decorative
 * `ID: SEC-8941-AZ` string with no real meaning.
 */
export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(AuthenticatedSessionController.store().url, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            <div className="mb-8 flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Welcome Back
                </h2>
                <p className="text-sm text-slate-600 sm:text-base">
                    Sign in to access your assigned cases, chain-of-custody ledgers, and
                    forensic vault.
                </p>
            </div>

            {status && (
                <div className="mb-6 rounded-[0.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-5">
                <IconTextField
                    id="agencyEmail"
                    icon="badge"
                    label="Work Email or Badge ID"
                    hint="Government or approved contractor domain"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="e.g. m.vance@forensics.gov"
                    error={errors.email}
                />

                <PasswordField
                    id="masterPassword"
                    label="Master Vault Password"
                    autoComplete="current-password"
                    required
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    error={errors.password}
                    action={
                        canResetPassword ? (
                            <Link
                                href={PasswordResetLinkController.create()}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        ) : null
                    }
                />

                <div className="flex items-center justify-between py-1">
                    <label className="flex cursor-pointer select-none items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-offset-0 focus:ring-slate-900"
                        />
                        <span className="text-xs text-slate-600">
                            Remember this workstation for 12 hours
                        </span>
                    </label>
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    size="lg"
                    className="w-full rounded-[0.25rem] shadow-md active:scale-[0.99]"
                >
                    <span className={`material-symbols-outlined text-[18px] ${processing ? 'animate-spin' : ''}`}>
                        {processing ? 'progress_activity' : 'lock_open'}
                    </span>
                    <span>{processing ? 'Verifying Credentials…' : 'Sign In to Evidence Vault'}</span>
                </Button>
            </form>
        </GuestLayout>
    );
}
