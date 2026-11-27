<script lang="ts">
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    calendarDateParser,
    useTemporalEditor,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import Calendar from './components/LocalizedCalendar.svelte';
  import CalendarParts from './components/CalendarParts.svelte';
  import { tick } from 'svelte';
  import { determineClearValue, useShadcnTextControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let showMenu = $state(false);
  let selectedDate = $state<DateValue | undefined>(undefined);
  let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

  const { binding, adaptValue } = useShadcnTextControl(props, clearValue);
  const editor = useTemporalEditor('date', binding, adaptValue, () => props.uischema.options);
  const jsonforms = useJsonForms();
  const locale = $derived(jsonforms.i18n?.locale ?? 'en-US');

  const toPickerDate = calendarDateParser(parseDate);

  const bounds = $derived(editor.calendarBounds(binding.shadcnProps('DatePicker'), toPickerDate));

  const pickerValue = $derived(toPickerDate(editor.pickerDate?.format('YYYY-MM-DD')));

  const { dateMode, showActions } = $derived(editor);
  const pickerRangeError = $derived(editor.dateRangeError(selectedDate?.toString(), showMenu));

  const inputAttributes = $derived(binding.shadcnProps('input'));

  $effect(() => {
    if (showMenu) {
      selectedDate = pickerValue;
      calendarPlaceholder = pickerValue ?? calendarPlaceholder;
    }
  });

  const { applyDateSelection: handlePickerChange } = editor;

  async function closeMenu() {
    showMenu = false;
    await tick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  function updatePickerPart(part: 'year' | 'month', value: number) {
    const base = selectedDate ?? pickerValue ?? today(getLocalTimeZone());
    selectedDate = base.set({ [part]: value });
    calendarPlaceholder = selectedDate;
    if (!showActions) handlePickerChange(selectedDate.toString());
  }
</script>

<CalendarParts
  bind:open={showMenu}
  field={{
    binding,
    editor,
    attributes: inputAttributes,
    kind: 'date',
    rangeError: !!pickerRangeError,
  }}
  value={selectedDate ?? calendarPlaceholder}
  {bounds}
  {locale}
  mode={dateMode}
  {updatePickerPart}
>
  <Calendar
    type="single"
    bind:value={selectedDate}
    bind:placeholder={calendarPlaceholder}
    minValue={bounds.pickerMin}
    maxValue={bounds.pickerMax}
    captionLayout="dropdown"
    {locale}
    onValueChange={async (value: DateValue | undefined) => {
      selectedDate = value;
      calendarPlaceholder = value ?? calendarPlaceholder;

      if (showActions) {
        return;
      }

      await closeMenu();
      handlePickerChange(value?.toString() ?? null);
    }}
    {...binding.shadcnProps('Calendar')}
    disabled={!binding.control.enabled}
    readonly={binding.control.readonly}
  />
  {#snippet footer()}
    <TemporalNotice
      controlId={binding.control.id}
      kind="range"
      text={pickerRangeError}
      class="text-destructive text-xs"
    />
    {#if showActions}
      <div class="flex justify-center gap-2">
        <Button
          variant="outline"
          onclick={() => {
            selectedDate = pickerValue;
            showMenu = false;
          }}
        >
          {editor.cancelLabel}
        </Button>
        <Button
          onclick={async () => {
            if (pickerRangeError) return;
            await closeMenu();
            handlePickerChange(selectedDate?.toString() ?? null);
          }}
          disabled={!binding.control.enabled ||
            binding.control.readonly ||
            !selectedDate ||
            editor.bounds.empty ||
            !!pickerRangeError}
        >
          {editor.okLabel}
        </Button>
      </div>
    {/if}
  {/snippet}
</CalendarParts>
