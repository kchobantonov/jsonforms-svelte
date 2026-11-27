<script lang="ts">
  import { PopoverContent } from '@chobantonov/jsonforms-svelte-shadcn';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  let {
    message,
    severity,
    compact,
    id,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean; id?: string } = $props();
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
    ><span {id} class="sr-only">{message}</span>
    <PopoverContent
      class="max-h-[min(20rem,calc(var(--bits-popover-content-available-height,20rem)-0.75rem),calc(100dvh-2rem))] max-w-xs overflow-y-auto overscroll-y-contain break-words"
      onOpenAutoFocus={(event) => event.preventDefault()}>{message}</PopoverContent
    >
  </Popover.Root>
{:else}
  <p {id} role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>
    {message}
  </p>
{/if}
