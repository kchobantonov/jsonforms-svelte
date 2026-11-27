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
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const temporalForm = useJsonForms();
  const message = useRendererMessages();
  import { Button, Popover } from 'flowbite-svelte';
  import { CalendarMonthOutline } from 'flowbite-svelte-icons';
  import { untrack } from 'svelte';
  import {
    determineClearValue,
    parseDateTime,
    temporalValueWithinBounds,
    useFlowbiteTextControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  let showMenu = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
  });
  const popoverReady = usePopoverReady();

  const { binding, adaptValue } = useFlowbiteTextControl(props, clearValue);
  const editor = useTemporalEditor('date', binding, adaptValue, () => props.uischema.options);

  const { minDate, maxDate } = $derived.by(() => {
    const picker = binding.flowbiteProps('Datepicker');
    return editor.pickerDateBounds(picker.availableFrom, picker.availableTo);
  });

  const pickerValue = $derived(editor.pickerDate?.toDate());

  const { dateMode, showActions } = $derived(editor);
  let coarseDate = $state<Date>();
  const storedDate = $derived(binding.control.data);
  $effect(() => {
    const value = storedDate;
    if (showMenu)
      coarseDate = untrack(() => parseDateTime(value, editor.formats)?.toDate() ?? new Date());
  });
  function updateCoarseDate(value: Date) {
    coarseDate = value;
    if (!showActions) handlePickerChange(coarseDate);
  }
  const coarseAllowed = $derived.by(() => {
    const date = parseDateTime(coarseDate, undefined);
    return !!date && temporalValueWithinBounds(date, editor.bounds);
  });
  const coarseRangeError = $derived(
    showMenu && dateMode !== 'date' && coarseDate && editor.restrict && !coarseAllowed
      ? message('date.outOfRange')
      : undefined,
  );

  const handlePickerChange = (value: Date | undefined) => editor.applyDateSelection(value, true);

  const componentId = $props.id();
  const menuId = `${componentId}-menu`;

  const restoreFocusOnEscape = focusPickerOnEscape(() => menuId);
</script>

<ControlWrapper {...binding.controlWrapper}>
  <TemporalInput {binding} {editor} rangeError={!!coarseRangeError}>
    {#snippet left()}
      <button
        type="button"
        id={menuId}
        class="pointer-events-auto m-0.5 rounded-sm p-0.5 whitespace-normal hover:bg-gray-100 focus:ring-1 focus:ring-gray-400 focus:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
        title={message('temporal.openDate')}
        aria-label={message('temporal.openDate')}
        aria-haspopup="dialog"
        aria-expanded={showMenu}
        disabled={!binding.control.enabled || binding.control.readonly}
        tabindex={-1}
      >
        <CalendarMonthOutline class="h-4 w-4" />
      </button>
      {#if popoverReady.value}
        <Popover
          onkeydowncapture={restoreFocusOnEscape}
          arrow={false}
          class="pointer-events-auto max-h-[min(30rem,calc(50dvh-2rem))] w-auto overflow-y-auto"
          placement="bottom-start"
          bind:isOpen={showMenu}
          trigger="click"
        >
          {#if dateMode !== 'date'}
            <CalendarPartSelects
              showMonth={dateMode === 'month'}
              date={coarseDate}
              fallbackMonth={0}
              {...editor.coarseDateAttributes}
              locale={temporalForm.i18n?.locale}
              update={updateCoarseDate}
            />
            <TemporalNotice
              controlId={binding.control.id}
              kind="range"
              text={coarseRangeError}
              class="text-xs text-red-600 dark:text-red-400"
            />
            {#if showActions}<div class="mt-2 flex justify-end gap-2">
                <Button color="alternative" size="sm" onclick={() => (showMenu = false)}
                  >{editor.cancelLabel}</Button
                >
                <Button
                  size="sm"
                  disabled={!binding.control.enabled || !coarseAllowed}
                  onclick={() => {
                    if (!coarseAllowed) return;
                    handlePickerChange(coarseDate);
                    showMenu = false;
                  }}>{editor.okLabel}</Button
                >
              </div>{/if}
          {:else}
            <Datepicker
              locale={temporalForm.i18n?.locale}
              {...binding.flowbiteProps('Datepicker')}
              value={pickerValue}
              inline
              availableFrom={parseDateTime(minDate, editor.formats)?.toDate()}
              availableTo={parseDateTime(maxDate, editor.formats)?.toDate()}
              onselect={(value) => {
                if (!showActions) {
                  handlePickerChange(value as Date);
                  showMenu = false;
                }
              }}
              onapply={(value) => handlePickerChange(value as Date)}
            >
              {#snippet actionSlot({ selectedDate, handleApply, close })}
                {#if showActions}
                  <div class="mt-2 flex justify-center gap-2">
                    <Button
                      color="alternative"
                      size="sm"
                      onclick={() => {
                        showMenu = false;
                        close();
                      }}>{editor.cancelLabel}</Button
                    >
                    <Button
                      size="sm"
                      color="primary"
                      onclick={() => {
                        if (selectedDate) {
                          handleApply(selectedDate);
                        }
                        showMenu = false;
                      }}
                      disabled={!selectedDate || editor.bounds.empty}>{editor.okLabel}</Button
                    >
                  </div>
                {/if}
              {/snippet}
            </Datepicker>
          {/if}
        </Popover>
      {/if}
    {/snippet}
  </TemporalInput>
</ControlWrapper>
