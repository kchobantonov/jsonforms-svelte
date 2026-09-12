<script lang="ts">
  import { formLanguages } from "../../i18n/form-languages.js";
  import * as Select from "@jsonforms-svelte-shadcn-ui/select/index.js";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  import { useEditorI18n } from "../../i18n/context.js";
  import type { JsonValue } from "../../document/types.js";
  let { translations }: { translations?: JsonValue } = $props();
  const i18n = useEditorI18n();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  const locales = $derived(formLanguages(translations));
</script>

{#if locales.length}
  <Select.Root
    type="single"
    value={i18n.formLocale}
    onValueChange={(value) => {
      if (locales.includes(value)) i18n.setFormLocale(value);
    }}
  >
    <Select.Trigger aria-label={i18n.t("Form language")} class="w-auto"
      >{i18n.t("Form language")}: {i18n.formLocale}</Select.Trigger
    >
    <Select.Content portalProps={{ to: target?.() }}>
      {#each locales as locale}<Select.Item value={locale} label={locale}
          >{locale}</Select.Item
        >{/each}
    </Select.Content>
  </Select.Root>
{/if}
