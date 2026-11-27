<script lang="ts">
  import {
    type ControlProps,
    NumberFormatCellContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import IntegerCell from './IntegerCell.svelte';
  import CellContent from './CellContent.svelte';

  const props: ControlProps = $props();
</script>

<NumberFormatCellContent {...props} {IntegerCell} {CellContent}>
  {#snippet clearButton(attributes)}
    <button
      {...attributes}
      class="btn-icon btn-icon-sm absolute inset-y-0 end-1 my-auto opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      >×</button
    >
  {/snippet}
</NumberFormatCellContent>
