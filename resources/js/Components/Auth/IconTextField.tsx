import InputError from '@/Components/InputError';
import { InputHTMLAttributes } from 'react';

interface IconTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: string;
    label: string;
    hint?: string;
    error?: string;
}

/** Icon-prefixed text input used throughout the Forensic Portal auth pages. */
export default function IconTextField({
    icon,
    label,
    hint,
    error,
    id,
    className = '',
    ...props
}: IconTextFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
                <span>{label}</span>
                {hint && <span className="text-[11px] font-normal normal-case text-slate-600">{hint}</span>}
            </label>
            <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[18px] text-slate-600">
                    {icon}
                </span>
                <input
                    id={id}
                    {...props}
                    className={`w-full rounded-[0.25rem] border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-600 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 ${className}`}
                />
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}
