import { Command as CommandPrimitive } from "bits-ui";
declare const CommandInput: import("svelte").Component<CommandPrimitive.InputProps, {}, "value" | "ref">;
type CommandInput = ReturnType<typeof CommandInput>;
export default CommandInput;
