<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    label,
    values,
    choices,
    multiple,
    change,
    disabled,
  }: {
    label: string;
    values: string[];
    choices: { value: string; label: string }[];
    multiple: boolean;
    change: (values: string[]) => void;
    disabled: boolean;
  } = $props();
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { getPortalTarget } from '@chobantonov/jsonforms-svelte-shadcn';
  let clearFocused = $state(false);
  let clearHovered = $state(false);
  let clearDismissed = $state(false);
  const clearHintOpen = $derived((clearFocused || clearHovered) && !clearDismissed);
</script>

{#snippet content()}
  <Select.Trigger
    aria-label={label}
    class="relative h-8 w-full min-w-0 pe-14 [&>svg]:absolute [&>svg]:end-3"
    ><span class="min-w-0 flex-1 truncate text-start"
      >{values.length
        ? choices
            .filter((choice) => values.includes(choice.value))
            .map((choice) => choice.label)
            .join(', ')
        : message(multiple ? 'cron.every' : 'cron.chooseRepeats')}</span
    ></Select.Trigger
  >
  <Select.Content portalProps={{ to: getPortalTarget() }}
    >{#each choices as choice (choice.value)}<Select.Item value={choice.value} label={choice.label}
        >{choice.label}</Select.Item
      >{/each}</Select.Content
  >
{/snippet}
<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  <!-- The wrapper owns the nested reset hint while the Select keeps its own keyboard handling. -->
  <div
    class="group/cron-choice relative min-w-0"
    onfocusin={(event) => {
      if (event.target instanceof Element && event.target.closest('[data-cron-reset]')) {
        clearFocused = true;
        clearDismissed = false;
      }
    }}
    onfocusout={(event) => {
      if (event.target instanceof Element && event.target.closest('[data-cron-reset]'))
        clearFocused = false;
    }}
    onkeydowncapture={(event) => {
      if (
        event.key === 'Escape' &&
        clearHintOpen &&
        event.target instanceof Element &&
        event.target.closest('[data-cron-reset]')
      ) {
        clearDismissed = true;
        event.stopPropagation();
      }
    }}
  >
    {#if multiple}<Select.Root type="multiple" value={values} onValueChange={change} {disabled}
        >{@render content()}</Select.Root
      >
    {:else}<Select.Root
        type="single"
        value={values[0] ?? ''}
        onValueChange={(value) => change([value])}
        {disabled}>{@render content()}</Select.Root
      >{/if}
    {#if multiple && values.length}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="absolute end-7 top-1/2 size-6 -translate-y-1/2 opacity-0 group-focus-within/cron-choice:opacity-100 group-hover/cron-choice:opacity-100"
        style={clearFocused ? 'opacity:1' : undefined}
        {disabled}
        aria-label={`${message('cron.every')}: ${label}`}
        title={`${message('cron.every')}: ${label}`}
        data-cron-reset
        onpointerenter={() => {
          clearHovered = true;
          clearDismissed = false;
        }}
        onpointerleave={() => (clearHovered = false)}
        onclick={() => {
          if (!disabled) change([]);
        }}><XIcon class="size-3" /></Button
      >
      {#if clearHintOpen}<span
          role="tooltip"
          data-tooltip-content
          class="bg-popover text-popover-foreground pointer-events-none absolute end-0 bottom-full z-50 mb-2 max-w-[min(18rem,calc(100vw-2rem))] rounded-md border px-2 py-1 text-xs shadow-md"
          >{`${message('cron.every')}: ${label}`}</span
        >{/if}
    {/if}
  </div>
</div>
