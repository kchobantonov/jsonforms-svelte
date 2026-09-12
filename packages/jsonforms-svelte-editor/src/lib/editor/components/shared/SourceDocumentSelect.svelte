<script lang="ts">
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  import * as Select from "@jsonforms-svelte-shadcn-ui/select/index.js";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  let {
    value = $bindable("model"),
    disabled = false,
  }: { value?: string; disabled?: boolean } = $props();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  const parts = [
    "model",
    "schema",
    "uischema",
    "uischemas",
    "data",
    "config",
    "translations",
  ];
</script>

<Select.Root type="single" bind:value {disabled}>
  <Select.Trigger aria-label={i18n.t("Source document")} class="source-document-trigger"
    >{value}</Select.Trigger
  >
  <Select.Content portalProps={{ to: target?.() }}>
    {#each parts as part}<Select.Item value={part} label={part}
        >{part}</Select.Item
      >{/each}
  </Select.Content>
</Select.Root>
