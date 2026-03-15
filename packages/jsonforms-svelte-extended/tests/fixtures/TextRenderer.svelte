<script lang="ts">
  import type { UISchemaElement } from "@jsonforms/core";

  const { uischema }: { uischema: UISchemaElement & { text?: string } } =
    $props();
</script>

<div>{uischema.text ?? uischema.type}</div>
