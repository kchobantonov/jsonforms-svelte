import { Select as SelectPrimitive } from 'bits-ui';
import SelectPortal from './select-portal.svelte';
import { type WithoutChild } from '@jsonforms-svelte-shadcn-ui/utils.js';
import type { ComponentProps } from 'svelte';
import type { WithoutChildrenOrChild } from '@jsonforms-svelte-shadcn-ui/utils.js';
type $$ComponentProps = WithoutChild<SelectPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectPortal>>;
};
declare const SelectContent: import("svelte").Component<$$ComponentProps, {}, "ref">;
type SelectContent = ReturnType<typeof SelectContent>;
export default SelectContent;
