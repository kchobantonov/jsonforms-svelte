import { type VariantProps } from 'tailwind-variants';
export declare const itemMediaVariants: import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        icon: string;
        image: string;
    };
}, undefined, "gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none", {
    variant: {
        default: string;
        icon: string;
        image: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        icon: string;
        image: string;
    };
}, undefined, "gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none", unknown, unknown, undefined>>;
export type ItemMediaVariant = VariantProps<typeof itemMediaVariants>['variant'];
import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: ItemMediaVariant;
};
declare const ItemMedia: import("svelte").Component<$$ComponentProps, {}, "ref">;
type ItemMedia = ReturnType<typeof ItemMedia>;
export default ItemMedia;
