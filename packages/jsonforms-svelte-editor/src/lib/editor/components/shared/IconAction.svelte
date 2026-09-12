<script lang="ts">
  import * as Tooltip from "@jsonforms-svelte-shadcn-ui/tooltip/index.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { getContext, type Snippet } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  let {
    label,
    disabled = false,
    onclick,
    children,
  }: {
    label: string;
    disabled?: boolean;
    onclick: () => void;
    children: Snippet;
  } = $props();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
</script>

<Tooltip.Provider
  ><Tooltip.Root
    ><Tooltip.Trigger>
      {#snippet child({ props })}<Button
          {...props}
          variant="ghost"
          size="icon"
          aria-label={label}
          {disabled}
          {onclick}>{@render children()}</Button
        >{/snippet}
    </Tooltip.Trigger><Tooltip.Content portalProps={{ to: target?.() }}
      >{label}</Tooltip.Content
    ></Tooltip.Root
  ></Tooltip.Provider
>
