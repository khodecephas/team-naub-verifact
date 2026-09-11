import { ReactNode } from 'react';

export function ReportSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
    return (
        <section className="border-t border-slate-300 pt-6">
            <h2 className="text-base font-bold tracking-tight text-slate-950">
                {number}. {title}
            </h2>
            <div className="mt-4 text-sm leading-7 text-slate-700">{children}</div>
        </section>
    );
}
