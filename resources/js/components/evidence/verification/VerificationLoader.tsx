import { LoaderCircle, ShieldCheck } from 'lucide-react';

export function VerificationLoader() {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-slate-950/75 p-6 backdrop-blur-sm">
            <div
                role="status"
                aria-live="polite"
                className="w-full max-w-md rounded-md border border-slate-600 bg-slate-900 p-8 text-center text-white shadow-2xl"
            >
                <div className="relative mx-auto h-16 w-16">
                    <ShieldCheck className="absolute inset-0 m-auto h-8 w-8 text-blue-300" />
                    <LoaderCircle className="h-16 w-16 animate-spin text-blue-400" />
                </div>
                <h2 className="pt-5 text-lg font-bold">Verifying integrity</h2>
                <div className="pt-3 text-sm leading-6 text-slate-300">
                    <p>Calculating SHA-256 checksum…</p>
                    <p>Comparing against registered baseline…</p>
                </div>
            </div>
        </div>
    );
}
