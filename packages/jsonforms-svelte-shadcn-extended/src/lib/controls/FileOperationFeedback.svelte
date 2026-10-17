<script lang="ts">
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { getPortalTarget } from '@chobantonov/jsonforms-svelte-shadcn';
  let {
    message,
    severity,
    compact,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean } = $props();
  let open = $state(false);
  const color = $derived(
    severity === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-destructive',
  );
</script>

{#if compact}
  <Popover.Root bind:open>
    <Popover.Trigger
      class={`inline-flex size-7 items-center justify-center rounded border ${color}`}
      aria-label={message}
      onpointerenter={() => (open = true)}
      onfocus={() => (open = true)}
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        open = true;
      }}>!</Popover.Trigger
    >
    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      class="max-w-xs break-words"
      onOpenAutoFocus={(event) => event.preventDefault()}>{message}</Popover.Content
    >
  </Popover.Root>
{:else}
  <p role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>{message}</p>
{/if}
