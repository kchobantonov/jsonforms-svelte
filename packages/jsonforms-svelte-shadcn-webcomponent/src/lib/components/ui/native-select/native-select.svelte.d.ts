import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { HTMLSelectAttributes } from 'svelte/elements';
type NativeSelectProps = Omit<WithElementRef<HTMLSelectAttributes>, 'size'> & {
    size?: 'sm' | 'default';
};
declare const NativeSelect: import("svelte").Component<NativeSelectProps, {}, "value" | "ref">;
type NativeSelect = ReturnType<typeof NativeSelect>;
export default NativeSelect;
