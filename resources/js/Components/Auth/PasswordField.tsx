import InputError from '@/Components/InputError';
import { InputHTMLAttributes, ReactNode, useState } from 'react';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    error?: string;
    /** Rendered next to the label — e.g. a "Forgot password?" link. */
    action?: ReactNode;
}

/** Password input with a show/hide toggle, used throughout the Forensic Portal auth pages. */
export default function PasswordField({
    label,
    error,
    action,
    id,
    className = '',
    ...props
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {label}
                </label>
                {action}
            </div>
            <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[18px] text-slate-600">
                    lock
                </span>
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    {...props}
                    className={`w-full rounded-[0.25rem] border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-600 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 ${className}`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    title="Toggle password visibility"
                    className="absolute right-3 rounded p-1 text-slate-600 transition-colors hover:text-slate-700"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {visible ? 'visibility_off' : 'visibility'}
                    </span>
                </button>
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}
