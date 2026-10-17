<script lang="ts">
  import { onMount } from 'svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import { useDetailDialog } from '../../src/lib/detailDialog.svelte';
  import DraftEditor from './DraftEditor.svelte';
  let { uischema }: { uischema: UISchemaElement } = $props();
  const editor = useDetailDialog({
    path: 'value',
    schema: { type: 'object' },
    label: 'Value',
    enabled: true,
    children: body,
  });
  onMount(() => uischema.options?.capture(editor));
</script>

{#snippet body()}{/snippet}
<button disabled={!editor.canApply} onclick={() => editor.apply()}>Apply</button>
{#if editor.active}<DraftEditor capture={uischema.options?.captureDraft} />{/if}
