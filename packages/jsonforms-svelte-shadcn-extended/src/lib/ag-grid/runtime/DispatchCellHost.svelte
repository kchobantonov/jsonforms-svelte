<script lang="ts">
  import { GridCellContent } from '@chobantonov/jsonforms-svelte-extended';
  import {
    TooltipContent,
    DetailDialog,
    PencilIcon,
    ValidationIcon,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

<GridCellContent {current} {DetailDialog} {ValidationIcon}>
  {#snippet selectButton(attributes)}
    <Tooltip.Provider
      ><Tooltip.Root
        ><Tooltip.Trigger>
          {#snippet child({ props: triggerProps })}
            <Button {...triggerProps} type="button" variant="ghost" size="icon-sm" {...attributes}
              ><PencilIcon class="size-4" />
            </Button>
          {/snippet}
        </Tooltip.Trigger><TooltipContent>{attributes.title}</TooltipContent></Tooltip.Root
      ></Tooltip.Provider
    >
  {/snippet}
</GridCellContent>
