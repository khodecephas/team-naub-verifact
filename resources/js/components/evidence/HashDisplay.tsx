import { useState } from 'react';

export function HashDisplay({ value, label = 'SHA-256 baseline' }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const copyHash = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="app-field-label">{label}</span>
                <button type="button" onClick={copyHash} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline" aria-label={`Copy ${label}`}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
                    {copied ? 'Copied' : 'Copy hash'}
                </button>
            </div>
            <code className="block break-all rounded border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">{value}</code>
        </div>
    );
}
