import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
    errors?: {
        message?: string;
    }[];
};
declare const FieldError: import("svelte").Component<$$ComponentProps, {}, "ref">;
type FieldError = ReturnType<typeof FieldError>;
export default FieldError;
