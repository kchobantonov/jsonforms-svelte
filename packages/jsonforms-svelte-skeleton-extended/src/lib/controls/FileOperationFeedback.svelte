<script lang="ts">
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  let {
    message,
    severity,
    compact,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean } = $props();
  let open = $state(false);
  const getRootNode = getPortalRootNodeGetter();
  const color = $derived(severity === 'warning' ? 'text-warning-700-300' : 'text-error-700-300');
</script>

{#if compact}
  <Popover {getRootNode} {open} onOpenChange={(details) => (open = details.open)} autoFocus={false}>
    <Popover.Trigger
      class={`btn-icon preset-tonal size-7 ${color}`}
      aria-label={message}
      onpointerenter={() => (open = true)}
      onfocus={() => (open = true)}
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        open = true;
      }}>!</Popover.Trigger
    >
    <Portal target={getPortalTarget()}>
      <Popover.Positioner
        ><Popover.Content class="card preset-filled-surface-50-950 max-w-xs p-3 text-sm break-words"
          >{message}</Popover.Content
        ></Popover.Positioner
      >
    </Portal>
  </Popover>
{:else}
  <p role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>{message}</p>
{/if}
