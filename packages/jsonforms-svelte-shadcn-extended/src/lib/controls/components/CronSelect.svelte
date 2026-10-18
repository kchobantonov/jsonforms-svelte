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
  <Select.Content class="max-h-64 overflow-y-auto" portalProps={{ to: getPortalTarget() }}
    >{#each choices as choice (choice.value)}<Select.Item value={choice.value} label={choice.label}
        >{choice.label}</Select.Item
      >{/each}</Select.Content
  >
{/snippet}
<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  <div class="group/cron-choice relative min-w-0">
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
        class="invisible absolute end-7 top-1/2 size-6 -translate-y-1/2 group-focus-within/cron-choice:visible group-hover/cron-choice:visible"
        {disabled}
        aria-label={`${message('cron.every')}: ${label}`}
        title={`${message('cron.every')}: ${label}`}
        onclick={() => {
          if (!disabled) change([]);
        }}><XIcon class="size-3" /></Button
      >
    {/if}
  </div>
</div>
