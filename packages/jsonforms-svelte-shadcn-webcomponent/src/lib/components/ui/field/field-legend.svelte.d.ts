import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
type $$ComponentProps = WithElementRef<HTMLAttributes<HTMLLegendElement>> & {
    variant?: 'legend' | 'label';
};
declare const FieldLegend: import("svelte").Component<$$ComponentProps, {}, "ref">;
type FieldLegend = ReturnType<typeof FieldLegend>;
export default FieldLegend;
