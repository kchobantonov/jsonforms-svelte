<script lang="ts">
  import { currentDate } from './components/currentPickerDate';
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CalendarPanel from './components/CalendarPanel.svelte';
  import TemporalPickerInput from './components/TemporalPickerInput.svelte';

  import { calendarPickerOptions, calendarControlProps } from '../util/calendarControlProps';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    calendarDateParser,
    useTemporalEditor,
    useDateTimePicker,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const temporalForm = useJsonForms();
  const message = useRendererMessages();
  import { DatePicker, parseDate, type DateValue } from '@skeletonlabs/skeleton-svelte';
  import { untrack } from 'svelte';
  import TimePicker from '../components/TimePicker.svelte';
  import {
    determineClearValue,
    getPortalRootNodeGetter,
    parseDateTime,
    useSkeletonTextControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  let selectedDate = $state<DateValue[]>([]);
  let focusedDate = $state<DateValue>();
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && draft.open) draft.open = false;
  });

  const { binding, adaptValue } = useSkeletonTextControl(props, clearValue);
  const editor = useTemporalEditor('dateTime', binding, adaptValue, () => props.uischema.options);

  const toPickerDate = calendarDateParser<DateValue>(parseDate);

  const picker = useDateTimePicker<DateValue[]>(binding, editor, {
    fromDate: (date) => {
      const value = toPickerDate(date?.format('YYYY-MM-DD'));
      return value ? [value] : [];
    },
    toDate: pickerDate,
    selected: () => selectedDate,
  });
  const { draft, handlePickerChange } = picker;
  const { pickerValue, showActions, dateMode, monthYearOnly, draftRangeError } = $derived(picker);

  $effect(() => {
    void draft.open;

    untrack(() => {
      if (draft.open) {
        selectedDate =
          pickerValue.date.length > 0
            ? [...pickerValue.date]
            : monthYearOnly
              ? [currentDate()]
              : [];
        focusedDate = selectedDate[0] ?? focusedDate;
        draft.time = picker.initialTime;
      } else {
        selectedDate = [];
        draft.time = undefined;
      }
    });
  });

  const bounds = $derived(editor.calendarBounds(binding.skeletonProps('DatePicker'), toPickerDate));

  function updatePickerPart(part: 'year' | 'month', value: number) {
    draft.rejected = false;
    selectedDate = [currentPickerDate.set({ [part]: value })];
    if (!showActions) handlePickerChange(selectedDate, draft.time);
  }

  const currentPickerDate = $derived(selectedDate[0] ?? pickerValue.date[0] ?? currentDate());

  const datePickerProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('DatePicker');

    return {
      ...calendarPickerOptions(skeletonProps, temporalForm.i18n?.locale, focusedDate, message),
      value: selectedDate,
      open: draft.open,
      min: bounds.pickerMin,
      max: bounds.pickerMax,
      closeOnSelect: false,
      ...calendarControlProps(
        binding.control,
        getRootNode,
        skeletonProps.positioning,
        (details) => {
          focusedDate = details.focusedValue;
        },
      ),
      onOpenChange: (details: { open: boolean }) => {
        draft.open = details.open;
      },
      onValueChange: (details: { value: DateValue[] }) => {
        draft.rejected = false;
        selectedDate = details.value;
        if (!showActions) {
          handlePickerChange(details.value, draft.time);
        }
      },
    };
  });

  function pickerDate(value: DateValue[] | undefined) {
    return parseDateTime(value?.[0]?.toString(), 'YYYY-MM-DD');
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <DatePicker {...datePickerProps}>
    <DatePicker.Control class="group relative w-full">
      <TemporalPickerInput
        {binding}
        {editor}
        attributes={binding.skeletonProps('input')}
        kind="dateTime"
        rangeError={!!(draft.open && draftRangeError)}
      />
    </DatePicker.Control>

    <CalendarPanel
      id={binding.control.id}
      {dateMode}
      date={currentPickerDate}
      {bounds}
      update={updatePickerPart}
      disabled={!binding.control.enabled || binding.control.readonly}
    >
      <TimePicker {...picker.timeInput} />

      <TemporalNotice
        controlId={binding.control.id}
        kind="range"
        text={draftRangeError}
        class="text-error-500 dark:text-error-400 text-xs"
      />
      {#if showActions}
        <div class="flex justify-center gap-2">
          <button
            type="button"
            class="btn btn-sm preset-tonal"
            onclick={() => {
              selectedDate = [];
              draft.time = undefined;
              draft.open = false;
            }}
          >
            {editor.cancelLabel}
          </button>
          <button
            type="button"
            class="btn btn-sm preset-filled"
            onclick={() => {
              if (draftRangeError) return;
              if (selectedDate.length > 0 && draft.time) {
                handlePickerChange(selectedDate, draft.time, true);
              }
              draft.open = false;
            }}
            disabled={binding.control.readonly ||
              selectedDate.length === 0 ||
              !draft.time ||
              !!draftRangeError}
          >
            {editor.okLabel}
          </button>
        </div>
      {/if}
    </CalendarPanel>
  </DatePicker>
  <TemporalNotice {...editor.hintNotice} class="text-surface-500 dark:text-surface-400 text-xs" />
</ControlWrapper>
