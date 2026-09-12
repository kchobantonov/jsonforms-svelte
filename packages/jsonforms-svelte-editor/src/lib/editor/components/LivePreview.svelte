<script lang="ts">
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
    data = $bindable<JsonValue>({}),
  }: {
    document: Document;
    mode: string;
    visible: boolean;
    data?: JsonValue;
  } = $props();
  const form = $derived({ ...document, data });
</script>

<section aria-label="Form Preview" hidden={!visible}>
  <h2>Form Preview</h2>
  {#if brokenScopes(document).length}
    <p class="notice">
      Preview needs resolved control bindings: {brokenScopes(document).join(
        ", ",
      )}
    </p>
  {:else if previewSafe(document)}{#key JSON.stringify( [document.schema, document.uischema, document.uischemas], )}<Runtime
        {form}
        {mode}
        onchange={(value) => {
          if (JSON.stringify(value) !== JSON.stringify(data))
            data = clone(value);
        }}
      />{/key}{:else}<p class="notice">
      This example contains executable extensions. Preview is unavailable until
      trusted preview isolation is implemented.
    </p>{/if}
</section>
