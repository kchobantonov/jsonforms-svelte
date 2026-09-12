<script lang="ts">
  import { onMount } from "svelte";
  import type { InitialForm, JsonValue } from "../../types.js";
  let {
    form,
    mode,
    onchange,
  }: {
    form: InitialForm;
    mode: string;
    onchange?: (data: JsonValue, errors: JsonValue[]) => void;
  } = $props();
  let container: HTMLDivElement;
  let element = $state<(HTMLElement & Record<string, unknown>) | undefined>();
  onMount(() => {
    const el = document.createElement(
      "jsonforms-svelte-shadcn",
    ) as HTMLElement & Record<string, unknown>;
    const listener = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail &&
        "data" in event.detail
      )
        onchange?.(event.detail.data, event.detail.errors ?? []);
    };
    el.addEventListener("change", listener);
    container.append(el);
    element = el;
    return () => {
      el.removeEventListener("change", listener);
      el.remove();
    };
  });
  $effect(() => {
    if (element) {
      element.schema = form.schema;
      element.uischema = form.uischema;
      element.uischemas = form.uischemas ?? [];
      element.config = form.config ?? {};
      element.translations = form.translations;
      element.locale = "en";
      element.mode = mode;
      element.data = form.data === undefined ? {} : form.data;
    }
  });
</script>

<div bind:this={container}></div>
