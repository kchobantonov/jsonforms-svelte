<script lang="ts">
  import Languages from "@lucide/svelte/icons/languages";
  import IconAction from "../shared/IconAction.svelte";
  import * as Dialog from "@jsonforms-svelte-shadcn-ui/dialog/index.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import Input from "@jsonforms-svelte-shadcn-ui/input/input.svelte";
  import Label from "@jsonforms-svelte-shadcn-ui/label/label.svelte";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  import { useEditorI18n } from "../../i18n/context.js";
  import { formLanguages } from "../../i18n/form-languages.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let { session }: { session: EditorSession } = $props();
  let open = $state(false),
    locale = $state(""),
    error = $state("");
  const id = $props.id();
  const i18n = useEditorI18n();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  function add(event: SubmitEvent) {
    event.preventDefault();
    try {
      session.addLanguage(locale);
      open = false;
    } catch (reason) {
      error =
        reason instanceof RangeError
          ? i18n.t("Enter a valid language code.")
          : i18n.t(String(reason instanceof Error ? reason.message : reason));
    }
  }
</script>

<IconAction
  label={i18n.t("Add form language")}
  disabled={session.locked}
  onclick={() => {
    open = true;
    locale = "";
    error = "";
  }}><Languages size={16} /></IconAction
>
<Dialog.Root bind:open>
  <Dialog.Content portalProps={{ to: target?.() }}>
    <Dialog.Header
      ><Dialog.Title>{i18n.t("Add form language")}</Dialog.Title
      ><Dialog.Description
        >{i18n.t(
          "Enter a language code, for example en, bg or fr-CA. Existing translations are preserved.",
        )}</Dialog.Description
      ></Dialog.Header
    >
    <p class="muted">
      {i18n.t("Form languages")}: {formLanguages(
        session.document.translations,
      ).join(", ") || i18n.t("None")}
    </p>
    <form class="editor-dialog-form" onsubmit={add}>
      <div class="editor-dialog-field">
        <Label for={id}>{i18n.t("Language code")}</Label>
        <Input {id} bind:value={locale} required />
      </div>
      {#if error}<p role="alert">{error}</p>{/if}
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (open = false)}
          >{i18n.t("Cancel")}</Button
        ><Button type="submit" disabled={session.locked}
          >{i18n.t("Add language")}</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
