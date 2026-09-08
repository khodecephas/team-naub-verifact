import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

const badgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors [&>svg]:size-3',
    {
        variants: {
            variant: {
                default: 'bg-secondary/10 text-secondary',
                success: 'bg-emerald-50 text-emerald-700',
                warning: 'bg-amber-50 text-amber-700',
                destructive: 'bg-destructive/10 text-destructive',
                outline: 'border-border text-foreground',
                muted: 'bg-muted text-muted-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : 'span';

    return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
