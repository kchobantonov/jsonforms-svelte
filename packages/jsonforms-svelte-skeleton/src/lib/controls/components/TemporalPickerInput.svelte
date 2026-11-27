<script lang="ts">
  import {
    TemporalPickerField,
    type TemporalPickerFieldProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { twMerge } from 'tailwind-merge';
  import { DatePicker, Popover } from '@skeletonlabs/skeleton-svelte';
  import { CalendarIcon, CalendarClockIcon, Clock3Icon, XIcon } from '@lucide/svelte';
  const props: TemporalPickerFieldProps = $props();
  const { kind, binding } = $derived(props);
  const Icon = $derived(
    kind === 'date' ? CalendarIcon : kind === 'time' ? Clock3Icon : CalendarClockIcon,
  );
  const Trigger = $derived(kind === 'time' ? Popover.Trigger : DatePicker.Trigger);
</script>

<TemporalPickerField {...props} merge={twMerge}>
  {#snippet trigger(label, disabled)}
    <Trigger
      id={kind === 'time' ? undefined : `${binding.control.id}-picker-trigger`}
      class={kind === 'time'
        ? 'hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-8 items-center justify-center'
        : 'hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none'}
      style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      {disabled}
      title={label}
      aria-label={label}
    >
      <Icon class="h-4 w-4" />
    </Trigger>
  {/snippet}
  {#snippet clear(label, disabled, onclick)}
    <button
      type="button"
      class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
      style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
      onmousedown={(event: MouseEvent) => event.preventDefault()}
      {onclick}
      {disabled}
      title={label}
      aria-label={label}
    >
      <XIcon class="h-4 w-4" />
    </button>
  {/snippet}
</TemporalPickerField>
