import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-md border border-slate-200 bg-white shadow-sm",
                className,
            )}
            {...props}
        />
    );
}

export function PanelHeader({
    title,
    description,
    action,
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-4 py-3",
                className,
            )}
        >
            <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
