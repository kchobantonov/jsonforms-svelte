<script lang="ts">
  import {
    type ControlProps,
    NumberFormatCellContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Textarea } from '@jsonforms-svelte-shadcn-ui/textarea';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import XIcon from '@lucide/svelte/icons/x';
  import IntegerCell from './IntegerCell.svelte';
  import CellContent from './CellContent.svelte';

  const props: ControlProps = $props();
</script>

<NumberFormatCellContent {...props} {IntegerCell} {CellContent} {Input} {Textarea}>
  {#snippet clearButton(attributes)}
    <Button
      {...attributes}
      variant="ghost"
      size="icon-xs"
      class="absolute inset-y-0 end-1 my-auto opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      ><XIcon class="size-4" /></Button
    >
  {/snippet}
</NumberFormatCellContent>
