<script lang="ts">
  import { currentDate } from './components/currentPickerDate';
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CalendarPanel from './components/CalendarPanel.svelte';
  import TemporalPickerInput from './components/TemporalPickerInput.svelte';

  import { untrack } from 'svelte';
  import { calendarPickerOptions, calendarControlProps } from '../util/calendarControlProps';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    calendarDateParser,
    useTemporalEditor,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const temporalForm = useJsonForms();
  const message = useRendererMessages();
  import { DatePicker, parseDate, type DateValue } from '@skeletonlabs/skeleton-svelte';
  import { determineClearValue, getPortalRootNodeGetter, useSkeletonTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  let showMenu = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
  });
  let selectedDate = $state<DateValue[]>([]);
  let focusedDate = $state<DateValue>();

  const { binding, adaptValue } = useSkeletonTextControl(props, clearValue);
  const editor = useTemporalEditor('date', binding, adaptValue, () => props.uischema.options);

  const toPickerDate = calendarDateParser<DateValue>(parseDate);

  const bounds = $derived(editor.calendarBounds(binding.skeletonProps('DatePicker'), toPickerDate));

  const pickerValue = $derived.by(() => {
    const date = toPickerDate(editor.pickerDate?.format('YYYY-MM-DD'));
    return date ? [date] : [];
  });

  const { dateMode, showActions } = $derived(editor);
  const monthYearOnly = $derived(dateMode !== 'date');
  const currentPickerDate = $derived(selectedDate[0] ?? pickerValue[0] ?? currentDate());
  const pickerRangeError = $derived(editor.dateRangeError(selectedDate[0]?.toString(), showMenu));

  const datePickerProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('DatePicker');

    return {
      ...calendarPickerOptions(skeletonProps, temporalForm.i18n?.locale, focusedDate, message),
      value: showActions || monthYearOnly ? selectedDate : pickerValue,
      open: showMenu,
      min: bounds.pickerMin,
      max: bounds.pickerMax,
      closeOnSelect: !showActions && !monthYearOnly,
      ...calendarControlProps(
        binding.control,
        getRootNode,
        skeletonProps.positioning,
        (details) => {
          focusedDate = details.focusedValue;
        },
      ),
      onOpenChange: (details: { open: boolean }) => {
        showMenu = details.open;
      },
      onValueChange: (details: { value: DateValue[]; valueAsString: string[] }) => {
        if (showActions) {
          selectedDate = details.value;
          return;
        }

        handlePickerChange(details.value[0]?.toString() ?? null);
        showMenu = false;
      },
    };
  });

  $effect(() => {
    if (showMenu) {
      selectedDate = [...pickerValue];
      focusedDate = pickerValue[0] ?? untrack(() => focusedDate);
    }
  });

  const { applyDateSelection: handlePickerChange } = editor;

  function updatePickerPart(part: 'year' | 'month', value: number) {
    selectedDate = [currentPickerDate.set({ [part]: value })];
    if (!showActions) handlePickerChange(selectedDate[0].toString());
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <DatePicker {...datePickerProps}>
    <DatePicker.Control class="group relative w-full">
      <TemporalPickerInput
        {binding}
        {editor}
        attributes={binding.skeletonProps('input')}
        kind="date"
        rangeError={!!pickerRangeError}
      />
    </DatePicker.Control>

    <CalendarPanel
      id={binding.control.id}
      {dateMode}
      date={currentPickerDate}
      {bounds}
      update={updatePickerPart}
    >
      <TemporalNotice
        controlId={binding.control.id}
        kind="range"
        text={pickerRangeError}
        class="text-error-500 text-xs"
      />
      {#if showActions}
        <div class="flex justify-center gap-2">
          <button
            type="button"
            class="btn btn-sm preset-tonal"
            onclick={() => {
              selectedDate = [...pickerValue];
              showMenu = false;
            }}
          >
            {editor.cancelLabel}
          </button>
          <button
            type="button"
            class="btn btn-sm preset-filled"
            onclick={() => {
              if (pickerRangeError) return;
              handlePickerChange(selectedDate[0]?.toString() ?? null);
              showMenu = false;
            }}
            disabled={selectedDate.length === 0 || editor.bounds.empty || !!pickerRangeError}
          >
            {editor.okLabel}
          </button>
        </div>
      {/if}
    </CalendarPanel>
  </DatePicker>
  <TemporalNotice {...editor.hintNotice} class="text-surface-500 dark:text-surface-400 text-xs" />
</ControlWrapper>
