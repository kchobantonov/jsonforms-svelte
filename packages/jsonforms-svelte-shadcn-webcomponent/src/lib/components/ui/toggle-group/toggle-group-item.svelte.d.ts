import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
import { type ToggleVariants } from '@jsonforms-svelte-shadcn-ui/toggle/index.js';
type $$ComponentProps = ToggleGroupPrimitive.ItemProps & ToggleVariants;
declare const ToggleGroupItem: import("svelte").Component<$$ComponentProps, {}, "value" | "ref">;
type ToggleGroupItem = ReturnType<typeof ToggleGroupItem>;
export default ToggleGroupItem;
