<script lang="ts">
  import { GridCellContent } from '@chobantonov/jsonforms-svelte-extended';
  import { DetailDialog, ValidationIcon } from '@chobantonov/jsonforms-svelte-flowbite';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  import { Button, Tooltip } from 'flowbite-svelte';
  import { PenOutline } from 'flowbite-svelte-icons';
  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

<GridCellContent {current} {DetailDialog} {ValidationIcon}>
  {#snippet selectButton(attributes)}
    <Button type="button" color="alternative" size="xs" {...attributes}
      ><PenOutline class="h-4 w-4" />
    </Button>
    <Tooltip>{attributes.title}</Tooltip>
  {/snippet}
</GridCellContent>
