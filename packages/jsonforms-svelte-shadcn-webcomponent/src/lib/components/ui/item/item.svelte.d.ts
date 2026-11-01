import { type VariantProps } from 'tailwind-variants';
export declare const itemVariants: import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        outline: string;
        muted: string;
    };
    size: {
        default: string;
        sm: string;
        xs: string;
    };
}, undefined, "[a]:hover:bg-muted rounded-lg border text-sm group/item focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-wrap items-center transition-colors duration-100 outline-none focus-visible:ring-[3px] [a]:transition-colors", {
    variant: {
        default: string;
        outline: string;
        muted: string;
    };
    size: {
        default: string;
        sm: string;
        xs: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        outline: string;
        muted: string;
    };
    size: {
        default: string;
        sm: string;
        xs: string;
    };
}, undefined, "[a]:hover:bg-muted rounded-lg border text-sm group/item focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-wrap items-center transition-colors duration-100 outline-none focus-visible:ring-[3px] [a]:transition-colors", unknown, unknown, undefined>>;
export type ItemSize = VariantProps<typeof itemVariants>['size'];
export type ItemVariant = VariantProps<typeof itemVariants>['variant'];
import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    child?: Snippet<[{
        props: Record<string, unknown>;
    }]>;
    variant?: ItemVariant;
    size?: ItemSize;
};
declare const Item: import("svelte").Component<$$ComponentProps, {}, "ref">;
type Item = ReturnType<typeof Item>;
export default Item;
