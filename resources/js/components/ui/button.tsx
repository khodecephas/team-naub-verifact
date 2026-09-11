import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded text-sm font-semibold transition-colors outline-none select-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border border-slate-950 bg-slate-900 text-white hover:bg-slate-800',
                secondary: 'border border-blue-800 bg-blue-800 text-white hover:bg-blue-700',
                outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
                ghost: 'text-foreground hover:bg-muted',
                destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                link: 'text-secondary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 px-3 text-xs',
                lg: 'h-11 px-6',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot.Root : 'button';

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
