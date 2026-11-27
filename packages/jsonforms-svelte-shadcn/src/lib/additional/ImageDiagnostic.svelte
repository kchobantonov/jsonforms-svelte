<script lang="ts">
  import TooltipContent from '../components/TooltipContent.svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { CircleAlert } from '@lucide/svelte';
  import { mergeProps } from 'bits-ui';
  import {
    ImageDiagnosticFrame,
    type ImageViewDiagnostic,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { diagnostic }: { diagnostic: ImageViewDiagnostic } = $props();
  let open = $state(false);
  let dismissed = $state(false);
</script>

<ImageDiagnosticFrame {diagnostic}>
  {#snippet children(warningLabel)}
    <Tooltip.Provider
      ><Tooltip.Root
        bind:open={() => open && !dismissed, (value) => (open = value && !dismissed)}
        disableCloseOnTriggerClick
      >
        <Tooltip.Trigger
          >{#snippet child({ props })}
            <Button
              {...mergeProps(props, {
                onfocus: () => (dismissed = false),
                onpointerenter: () => (dismissed = false),
                onclick: () => {
                  dismissed = false;
                  open = true;
                },
                onkeydown: (event: KeyboardEvent) => {
                  if (event.key === 'Escape') {
                    dismissed = true;
                    open = false;
                  }
                },
              })}
              type="button"
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0"
              aria-label={warningLabel}
            >
              <CircleAlert size={16} aria-hidden="true" />
            </Button>
          {/snippet}</Tooltip.Trigger
        >
        <TooltipContent
          role="tooltip"
          class="max-w-[min(22rem,70vw)] [overflow-wrap:anywhere] whitespace-normal"
          >{diagnostic.message}</TooltipContent
        >
      </Tooltip.Root></Tooltip.Provider
    >
  {/snippet}
</ImageDiagnosticFrame>
