<script lang="ts">
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    calendarDateParser,
    useTemporalEditor,
    useDateTimePicker,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import CalendarParts from './components/CalendarParts.svelte';
  import Calendar from './components/LocalizedCalendar.svelte';
  import { untrack } from 'svelte';
  import TimePicker from '../components/TimePicker.svelte';
  import { determineClearValue, parseDateTime, useShadcnTextControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let selectedDate = $state<DateValue | undefined>(undefined);
  let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

  const { binding, adaptValue } = useShadcnTextControl(props, clearValue);
  const editor = useTemporalEditor('dateTime', binding, adaptValue, () => props.uischema.options);
  const jsonforms = useJsonForms();
  const locale = $derived(jsonforms.i18n?.locale ?? 'en-US');

  const toPickerDate = calendarDateParser(parseDate);

  const picker = useDateTimePicker(binding, editor, {
    fromDate: (date) => toPickerDate(date?.format('YYYY-MM-DD')),
    toDate: pickerDate,
    selected: () => selectedDate,
  });
  const { draft, handlePickerChange } = picker;
  const { pickerValue, showActions, dateMode, monthYearOnly, draftRangeError } = $derived(picker);

  $effect(() => {
    const open = draft.open;

    untrack(() => {
      if (open) {
        selectedDate = pickerValue.date ?? (monthYearOnly ? today(getLocalTimeZone()) : undefined);
        calendarPlaceholder = pickerValue.date ?? calendarPlaceholder;
        draft.time = picker.initialTime;
      } else {
        selectedDate = undefined;
        draft.time = undefined;
      }
    });
  });

  function updatePickerPart(part: 'year' | 'month', value: number) {
    const base = selectedDate ?? pickerValue.date ?? today(getLocalTimeZone());
    draft.rejected = false;
    selectedDate = base.set({ [part]: value });
    calendarPlaceholder = selectedDate;
    if (!showActions) handlePickerChange(selectedDate, draft.time);
  }

  const bounds = $derived(editor.calendarBounds(binding.shadcnProps('DatePicker'), toPickerDate));

  const inputAttributes = $derived(binding.shadcnProps('input'));

  function pickerDate(value: DateValue | undefined) {
    return parseDateTime(value?.toString(), 'YYYY-MM-DD');
  }
</script>

<CalendarParts
  bind:open={draft.open}
  field={{
    binding,
    editor,
    attributes: inputAttributes,
    kind: 'dateTime',
    rangeError: !!(draft.open && draftRangeError),
  }}
  value={selectedDate ?? calendarPlaceholder}
  {bounds}
  {locale}
  mode={dateMode}
  {updatePickerPart}
>
  <Calendar
    type="single"
    value={selectedDate}
    bind:placeholder={calendarPlaceholder}
    minValue={bounds.pickerMin}
    maxValue={bounds.pickerMax}
    captionLayout="dropdown"
    {locale}
    onValueChange={(value: DateValue | undefined) => {
      draft.rejected = false;
      selectedDate = value;
      calendarPlaceholder = value ?? calendarPlaceholder;

      if (showActions) {
        return;
      }

      if (handlePickerChange(value, draft.time)) draft.open = false;
    }}
    {...binding.shadcnProps('Calendar')}
    disabled={!binding.control.enabled}
    readonly={binding.control.readonly}
  />
  {#snippet footer()}
    <TimePicker {...picker.timeInput} />
    <TemporalNotice
      controlId={binding.control.id}
      kind="range"
      text={draftRangeError}
      class="text-destructive text-xs"
    />
    {#if showActions}
      <div class="flex justify-center gap-2">
        <Button variant="outline" size="sm" onclick={() => (draft.open = false)}>
          {editor.cancelLabel}
        </Button>
        <Button
          size="sm"
          disabled={binding.control.readonly || !selectedDate || !draft.time || !!draftRangeError}
          onclick={() => {
            if (draftRangeError) return;
            handlePickerChange(selectedDate, draft.time, true);
            draft.open = false;
          }}
        >
          {editor.okLabel}
        </Button>
      </div>
    {/if}
  {/snippet}
</CalendarParts>
