<script lang="ts">
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlert } from '@lucide/svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  import {
    ImageDiagnosticFrame,
    type ImageViewDiagnostic,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { diagnostic }: { diagnostic: ImageViewDiagnostic } = $props();
  let open = $state(false);
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
</script>

<ImageDiagnosticFrame {diagnostic}>
  {#snippet children(warningLabel)}
    <Tooltip
      {open}
      onOpenChange={(event) => (open = event.open)}
      {getRootNode}
      closeOnClick={false}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger
        type="button"
        class="btn-icon h-6 w-6 shrink-0"
        aria-label={warningLabel}
        onclick={() => (open = true)}><CircleAlert size={16} aria-hidden="true" /></Tooltip.Trigger
      >
      <Portal target={resolvePortalTarget() ?? undefined}
        ><Tooltip.Context
          >{#snippet children(tooltip)}
            <div {...tooltip().getPositionerProps()}>
              <Tooltip.Content
                class="card preset-filled-surface-950-50 max-w-[min(22rem,70vw)] px-3 py-2 text-sm [overflow-wrap:anywhere] whitespace-normal shadow-xl"
                >{diagnostic.message}</Tooltip.Content
              >
            </div>
          {/snippet}</Tooltip.Context
        ></Portal
      >
    </Tooltip>
  {/snippet}
</ImageDiagnosticFrame>
