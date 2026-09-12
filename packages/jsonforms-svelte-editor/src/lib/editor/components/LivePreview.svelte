<script lang="ts">
  import { untrack } from "svelte";
  import Runtime from "./preview/Runtime.svelte";
  import {
    clone,
    brokenScopes,
    previewSafe,
    type Document,
  } from "../document/commands/index.js";
  import type { JsonValue } from "../document/types.js";
  let {
    document,
    mode,
    visible,
  }: { document: Document; mode: string; visible: boolean } = $props();
  let data = $state<JsonValue>(
    clone(untrack(() => (document.data === undefined ? {} : document.data))),
  );
  const form = $derived({ ...document, data });
</script>

<section aria-label="Form preview" hidden={!visible}>
  <h2>Form preview</h2>
  {#if brokenScopes(document).length}
    <p class="notice">
      Preview needs resolved control bindings: {brokenScopes(document).join(
        ", ",
      )}
    </p>
  {:else if previewSafe(document)}<Runtime
      {form}
      {mode}
      onchange={(value) => {
        if (JSON.stringify(value) !== JSON.stringify(data)) data = clone(value);
      }}
    />{:else}<p class="notice">
      This example contains executable extensions. Preview is unavailable until
      trusted preview isolation is implemented.
    </p>{/if}
</section>
