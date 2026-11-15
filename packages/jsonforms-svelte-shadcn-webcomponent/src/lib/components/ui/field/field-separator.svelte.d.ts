import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
};
declare const FieldSeparator: import("svelte").Component<$$ComponentProps, {}, "ref">;
type FieldSeparator = ReturnType<typeof FieldSeparator>;
export default FieldSeparator;
