<script lang="ts">
  import PopoverContent from '../../components/PopoverContent.svelte';
  import ControlWrapper from '../ControlWrapper.svelte';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import {
    TemporalNotice,
    type TemporalPickerFieldProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TemporalPickerInput from './TemporalPickerInput.svelte';
  import type { useShadcnTextControl } from '../../util';
  import type { Snippet } from 'svelte';
  import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
  import * as NativeSelect from '@jsonforms-svelte-shadcn-ui/native-select';
  import {
    calendarYears,
    calendarMonths,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let {
    value,
    bounds,
    locale,
    open = $bindable(),
    field,
    mode,
    children,
    footer,
    updatePickerPart,
  }: {
    value: DateValue;
    bounds: { pickerMin?: DateValue; pickerMax?: DateValue };
    locale: string;
    open: boolean;
    field: TemporalPickerFieldProps & {
      binding: ReturnType<typeof useShadcnTextControl>['binding'];
    };
    mode: 'date' | 'month' | 'year';
    children: Snippet;
    footer: Snippet;
    updatePickerPart(part: 'year' | 'month', value: number): void;
  } = $props();
  const message = useRendererMessages();
  const selectableYears = $derived(
    calendarYears(bounds.pickerMin?.year, bounds.pickerMax?.year, today(getLocalTimeZone()).year),
  );
  const selectableMonths = $derived(calendarMonths(locale, 1));
  const disabled = $derived(!field.binding.control.enabled || field.binding.control.readonly);
</script>

<ControlWrapper {...field.binding.controlWrapper}>
  <Popover.Root bind:open {...field.binding.shadcnProps('Popover')}>
    <div class="group relative w-full"><TemporalPickerInput {...field} /></div>

    <PopoverContent
      align="start"
      class="max-h-[min(30rem,var(--bits-popover-content-available-height,30rem),calc(100dvh-2rem))] w-auto space-y-4 overflow-y-auto p-2"
    >
      {#if mode === 'date'}
        {@render children()}
      {:else}
        <div class="grid min-w-72 grid-cols-2 gap-2 p-2">
          {#if mode === 'month'}
            <NativeSelect.Root
              {disabled}
              class="w-full"
              value={String(value.month)}
              aria-label={message('temporal.month')}
              onchange={(event) => updatePickerPart('month', Number(event.currentTarget.value))}
            >
              {#each selectableMonths as month (month.value)}
                <NativeSelect.Option value={String(month.value)}>{month.label}</NativeSelect.Option>
              {/each}
            </NativeSelect.Root>
          {/if}
          <NativeSelect.Root
            {disabled}
            class="w-full"
            value={String(value.year)}
            aria-label={message('temporal.year')}
            onchange={(event) => updatePickerPart('year', Number(event.currentTarget.value))}
          >
            {#each selectableYears as year (year)}
              <NativeSelect.Option value={String(year)}>{year}</NativeSelect.Option>
            {/each}
          </NativeSelect.Root>
        </div>
      {/if}
      {@render footer()}
    </PopoverContent>
  </Popover.Root>
  <TemporalNotice {...field.editor.hintNotice} class="text-muted-foreground text-xs" />
</ControlWrapper>
