<script lang="ts">
  import {
    TemporalPickerField,
    type TemporalPickerFieldProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { CalendarIcon, CalendarClockIcon, Clock3Icon, XIcon } from '$lib/components/icons';
  const props: TemporalPickerFieldProps = $props();
  const { kind } = $derived(props);
  const Icon = $derived(
    kind === 'date' ? CalendarIcon : kind === 'time' ? Clock3Icon : CalendarClockIcon,
  );
</script>

<TemporalPickerField {...props} merge={twMerge}>
  {#snippet trigger(label, disabled)}
    <Popover.Trigger
      class="text-muted-foreground hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
      style={kind === 'date'
        ? 'position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;'
        : undefined}
      {disabled}
      title={label}
      aria-label={label}
    >
      <Icon class={kind === 'dateTime' ? 'size-4' : 'h-4 w-4'} />
    </Popover.Trigger>
  {/snippet}
  {#snippet clear(label, disabled, onclick)}
    <Button
      variant="ghost"
      size="icon"
      class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      onmousedown={(event: MouseEvent) => event.preventDefault()}
      {onclick}
      {disabled}
      title={label}
      aria-label={label}
    >
      <XIcon class={kind === 'dateTime' ? undefined : 'h-4 w-4'} />
    </Button>
  {/snippet}
</TemporalPickerField>
