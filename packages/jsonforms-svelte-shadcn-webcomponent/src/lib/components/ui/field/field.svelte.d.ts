import { type VariantProps } from 'tailwind-variants';
export declare const fieldVariants: import("tailwind-variants").TVReturnType<{
    orientation: {
        vertical: string;
        horizontal: string;
        responsive: string;
    };
}, undefined, "data-[invalid=true]:text-destructive gap-2 group/field flex w-full", {
    orientation: {
        vertical: string;
        horizontal: string;
        responsive: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    orientation: {
        vertical: string;
        horizontal: string;
        responsive: string;
    };
}, undefined, "data-[invalid=true]:text-destructive gap-2 group/field flex w-full", unknown, unknown, undefined>>;
export type FieldOrientation = VariantProps<typeof fieldVariants>['orientation'];
import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    orientation?: FieldOrientation;
};
declare const Field: import("svelte").Component<$$ComponentProps, {}, "ref">;
type Field = ReturnType<typeof Field>;
export default Field;
