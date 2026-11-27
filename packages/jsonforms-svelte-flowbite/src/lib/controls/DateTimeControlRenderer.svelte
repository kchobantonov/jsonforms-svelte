<script lang="ts">
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { usePopoverReady } from './components/popoverReady.svelte';
  import CalendarPartSelects from './components/CalendarPartSelects.svelte';
  import TemporalInput from './components/TemporalInput.svelte';

  import Datepicker from './components/LocalizedDatepicker.svelte';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    useTemporalEditor,
    focusPickerOnEscape,
    useDateTimePicker,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const temporalForm = useJsonForms();
  const message = useRendererMessages();
  import { Button, Popover } from 'flowbite-svelte';
  import { untrack } from 'svelte';
  import { determineClearValue, parseDateTime, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import CalendarClockOutline from '../components/CalendarClockOutline.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let selectedDate = $state<Date | undefined>(undefined);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && draft.open) draft.open = false;
  });
  const popoverReady = usePopoverReady();

  $effect(() => {
    void draft.open;
    // reset state

    untrack(() => {
      if (draft.open) {
        selectedDate = pickerValue.date ?? (monthYearOnly ? new Date() : undefined);
        draft.time = picker.initialTime;
      } else {
        selectedDate = undefined;
        draft.time = undefined;
      }
    });
  });

  const { binding, adaptValue } = useFlowbiteTextControl(props, clearValue);
  const editor = useTemporalEditor('dateTime', binding, adaptValue, () => props.uischema.options);

  const picker = useDateTimePicker(binding, editor, {
    fromDate: (date) => date?.toDate(),
    toDate: pickerDate,
    selected: () => selectedDate,
    commit: binding.onChange,
    timeBounds: () => binding.flowbiteProps('Timepicker'),
  });
  const { draft, handlePickerChange } = picker;
  const { pickerValue, showActions, dateMode, monthYearOnly, draftRangeError } = $derived(picker);

  function updateCoarseDate(value: Date) {
    draft.rejected = false;
    selectedDate = value;
    if (!showActions) handlePickerChange(selectedDate, draft.time);
  }

  const { minDate, maxDate } = $derived.by(() => {
    const picker = binding.flowbiteProps('Datepicker');
    return editor.pickerDateBounds(picker.availableFrom, picker.availableTo);
  });

  function pickerDate(value: Date | undefined) {
    return parseDateTime(value, undefined);
  }

  const componentId = $props.id();
  const menuId = `${componentId}-menu`;

  const restoreFocusOnEscape = focusPickerOnEscape(() => menuId);
</script>

<ControlWrapper {...binding.controlWrapper}>
  <TemporalInput {binding} {editor} rangeError={!!(draft.open && draftRangeError)}>
    {#snippet left()}
      <button
        type="button"
        id={menuId}
        class="pointer-events-auto m-0.5 rounded-sm p-0.5 whitespace-normal hover:bg-gray-100 focus:ring-1 focus:ring-gray-400 focus:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
        title={message('temporal.openDateTime')}
        aria-label={message('temporal.openDateTime')}
        aria-haspopup="dialog"
        aria-expanded={draft.open}
        disabled={!binding.control.enabled || binding.control.readonly}
        tabindex={-1}
      >
        <CalendarClockOutline class="h-4 w-4" />
      </button>
      {#if popoverReady.value}
        <Popover
          onkeydowncapture={restoreFocusOnEscape}
          arrow={false}
          class="pointer-events-auto max-h-[min(30rem,calc(50dvh-2rem))] w-auto overflow-y-auto"
          placement="bottom-start"
          bind:isOpen={draft.open}
          trigger="click"
        >
          {#if monthYearOnly}
            {#key draft.open}
              <CalendarPartSelects
                showMonth={dateMode === 'month'}
                date={selectedDate}
                fallbackMonth={new Date().getMonth()}
                {...editor.coarseDateAttributes}
                locale={temporalForm.i18n?.locale}
                update={updateCoarseDate}
              />
            {/key}
          {:else}
            <Datepicker
              locale={temporalForm.i18n?.locale}
              {...binding.flowbiteProps('Datepicker')}
              value={selectedDate ?? pickerValue.date}
              inline
              availableFrom={parseDateTime(minDate, 'YYYY-MM-DD')?.toDate()}
              availableTo={parseDateTime(maxDate, 'YYYY-MM-DD')?.toDate()}
              onselect={(value) => {
                draft.rejected = false;
                selectedDate = value as Date;
                handlePickerChange(selectedDate, draft.time);
              }}
              showActionButtons={false}
            ></Datepicker>
          {/if}
          <TimePicker
            {...picker.timeInput}
            disabled={!binding.control.enabled || editor.bounds.empty}
          />

          <TemporalNotice
            controlId={binding.control.id}
            kind="range"
            text={draftRangeError}
            class="text-xs text-red-500 dark:text-red-400"
          />
          {#if showActions}
            <div class="mt-2 flex justify-center gap-2">
              <Button
                color="alternative"
                size="sm"
                onclick={() => {
                  selectedDate = undefined;
                  draft.time = undefined;
                  draft.open = false;
                }}>{editor.cancelLabel}</Button
              >
              <Button
                size="sm"
                color="primary"
                onclick={() => {
                  if (draftRangeError) return;
                  if (selectedDate && draft.time) {
                    handlePickerChange(selectedDate, draft.time, true);
                  }
                  draft.open = false;
                }}
                disabled={!selectedDate || !draft.time || !!draftRangeError}
                >{editor.okLabel}</Button
              >
            </div>
          {/if}
        </Popover>
      {/if}
    {/snippet}
  </TemporalInput>
</ControlWrapper>
