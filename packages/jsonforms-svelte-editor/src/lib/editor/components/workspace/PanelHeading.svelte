<script lang="ts">
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  import ChevronsRight from "@lucide/svelte/icons/chevrons-right";
  import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
  import ChevronsDown from "@lucide/svelte/icons/chevrons-down";
  import type { Snippet } from "svelte";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  let {
    title,
    children,
    oncollapse,
    onexpand,
    collapseDirection = "down",
  }: {
    title: string;
    children?: Snippet;
    oncollapse?: () => void;
    onexpand?: () => void;
    collapseDirection?: "down" | "right";
  } = $props();
</script>

<div class="panel-heading">
  <h2>{i18n.t(title)}</h2>
  {@render children?.()}
  {#if oncollapse}<Button
      variant="ghost"
      size="sm"
      aria-label={`${i18n.t("Hide")} ${i18n.t(title)}`}
      onclick={oncollapse}
      >{#if collapseDirection === "right"}<ChevronsRight
          size={16}
        />{:else}<ChevronsDown size={16} />{/if}</Button
    >
  {/if}
  {#if onexpand}<Button
      variant="ghost"
      size="sm"
      aria-label={`${i18n.t("Show")} ${i18n.t(title)}`}
      aria-expanded={false}
      onclick={onexpand}><ChevronsUp size={16} /></Button
    >{/if}
</div>
