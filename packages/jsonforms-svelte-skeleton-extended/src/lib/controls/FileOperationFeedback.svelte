<script lang="ts">
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  let {
    message,
    severity,
    compact,
    id,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean; id?: string } = $props();
  let open = $state(false);
  const getRootNode = getPortalRootNodeGetter();
  const color = $derived(severity === 'warning' ? 'text-warning-700-300' : 'text-error-700-300');
</script>

{#if compact}
  <Popover
    {getRootNode}
    {open}
    onOpenChange={(details) => (open = details.open)}
    autoFocus={false}
    positioning={{ strategy: 'fixed' }}
  >
    <Popover.Trigger
      class={`btn-icon preset-tonal size-7 ${color}`}
      aria-label={message}
      onpointerenter={() => (open = true)}
      onfocus={() => (open = true)}
      onkeydowncapture={(event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        open = false;
      }}
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        open = true;
      }}>!</Popover.Trigger
    ><span {id} class="sr-only">{message}</span>
    <Portal target={getPortalTarget()}>
      <Popover.Positioner
        ><Popover.Content
          class="card preset-filled-surface-50-950 max-h-[min(20rem,var(--available-height,20rem),calc(100dvh-2rem))] max-w-xs overflow-y-auto overscroll-y-contain p-3 text-sm break-words"
          >{message}</Popover.Content
        ></Popover.Positioner
      >
    </Portal>
  </Popover>
{:else}
  <p {id} role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>
    {message}
  </p>
{/if}
