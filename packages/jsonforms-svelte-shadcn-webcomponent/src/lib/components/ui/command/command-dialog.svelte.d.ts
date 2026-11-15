import { type WithoutChildrenOrChild } from "@jsonforms-svelte-shadcn-ui/utils.js";
import type { Command as CommandPrimitive, Dialog as DialogPrimitive } from "bits-ui";
import type { Snippet } from "svelte";
type $$ComponentProps = WithoutChildrenOrChild<DialogPrimitive.RootProps> & WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
    portalProps?: DialogPrimitive.PortalProps;
    children: Snippet;
    title?: string;
    description?: string;
    showCloseButton?: boolean;
    class?: string;
};
declare const CommandDialog: import("svelte").Component<$$ComponentProps, {}, "value" | "open" | "ref">;
type CommandDialog = ReturnType<typeof CommandDialog>;
export default CommandDialog;
