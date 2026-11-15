import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
import { type WithElementRef } from '@jsonforms-svelte-shadcn-ui/utils.js';
type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;
type Props = WithElementRef<Omit<HTMLInputAttributes, 'type'> & ({
    type: 'file';
    files?: FileList;
} | {
    type?: InputType;
    files?: undefined;
})>;
declare const Input: import("svelte").Component<Props, {}, "value" | "ref" | "files">;
type Input = ReturnType<typeof Input>;
export default Input;
