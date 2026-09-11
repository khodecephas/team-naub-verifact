import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function HashDisplay({ value, label = 'SHA-256' }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const shortened = `${value.slice(0, 8)}…${value.slice(-8)}`;

    const copy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{label}:</span>
            <code title={value} className="font-mono text-xs font-semibold text-slate-800">
                {shortened}
            </code>
            <button
                type="button"
                onClick={copy}
                title="Copy full SHA-256 hash"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700"
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="sr-only">Copy full hash</span>
            </button>
        </div>
    );
}
