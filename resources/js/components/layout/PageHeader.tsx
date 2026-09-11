import type { ReactNode } from "react";

interface PageHeaderProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: PageHeaderProps) {
    return (
        <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-end">
            <div className="min-w-0">
                {eyebrow && (
                    <div className="mb-1 text-xs font-medium text-slate-500">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-slate-950">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
