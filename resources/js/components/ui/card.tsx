import { cn } from '@/lib/utils';
import * as React from 'react';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm',
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('border-b border-slate-200 p-5', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
    return (
        <h2
            className={cn(
                'text-xs font-bold uppercase tracking-[0.14em] text-slate-800',
                className,
            )}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p className={cn('pt-1 text-xs leading-5 text-slate-500', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('p-5', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
