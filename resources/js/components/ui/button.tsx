import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring/50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
                secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90',
                outline: 'border border-border bg-white text-foreground shadow-sm hover:bg-muted',
                ghost: 'text-foreground hover:bg-muted',
                destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                link: 'text-secondary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded px-3 text-xs',
                lg: 'h-11 rounded-md px-6',
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
