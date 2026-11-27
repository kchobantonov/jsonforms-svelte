<script lang="ts">
  import {
    type ControlProps,
    NumberFormatCellContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input, Textarea, Button } from 'flowbite-svelte';
  import IntegerCell from './IntegerCell.svelte';
  import CellContent from './CellContent.svelte';

  const props: ControlProps = $props();
</script>

<NumberFormatCellContent {...props} {IntegerCell} {CellContent} {Input} {Textarea}>
  {#snippet clearButton(attributes)}
    <Button
      {...attributes}
      size="xs"
      class="absolute inset-y-0 end-1 my-auto h-6 w-6 p-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      >×</Button
    >
  {/snippet}
</NumberFormatCellContent>
