<script lang="ts">
  import { TimePickerPanel } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { usePopoverReady } from './components/popoverReady.svelte';
  import TemporalInput from './components/TemporalInput.svelte';

  import {
    useTimeControlPicker,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import { Button, Popover } from 'flowbite-svelte';
  import { ClockOutline } from 'flowbite-svelte-icons';
  import { determineClearValue, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  // using custom TimePicker not the one provided by svelte-flowbite for now since the one that is default uses input type time and rely on the browser to render that
  import TimePicker from '../components/TimePicker.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const popoverReady = usePopoverReady();

  const { binding, adaptValue } = useFlowbiteTextControl(props, clearValue);
  const picker = useTimeControlPicker(
    binding,
    adaptValue,
    () => props.uischema.options,
    () => true,
    () => binding.flowbiteProps('Timepicker'),
  );
  const { editor } = picker;
  const { offsetBounded, pickerRangeError } = $derived(picker);
  const componentId = $props.id();
  const menuId = `${componentId}-menu`;
</script>

<ControlWrapper {...binding.controlWrapper}>
  <TemporalInput {binding} {editor} rangeError={!!pickerRangeError}>
    {#snippet left()}
      <button
        type="button"
        id={menuId}
        class="pointer-events-auto m-0.5 rounded-sm p-0.5 whitespace-normal hover:bg-gray-100 focus:ring-1 focus:ring-gray-400 focus:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
        title={message('temporal.openTime')}
        aria-label={message('temporal.openTime')}
        aria-haspopup="dialog"
        aria-expanded={picker.showMenu}
        disabled={!binding.control.enabled || binding.control.readonly}
        tabindex={-1}
      >
        <ClockOutline class="h-4 w-4" />
      </button>
      {#if popoverReady.value}
        <Popover
          arrow={false}
          class="pointer-events-auto max-h-[min(30rem,calc(50dvh-2rem))] w-auto overflow-y-auto p-3"
          placement="bottom-start"
          bind:isOpen={picker.showMenu}
          trigger="click"
        >
          <TimePickerPanel
            {TimePicker}
            {picker}
            {...picker.panelProps}
            disabled={!binding.control.enabled || (!offsetBounded && editor.bounds.empty)}
            resetOnOpen={false}
            actionClass="mt-2 flex justify-center gap-2"
            errorClass="text-xs text-red-600 dark:text-red-400"
          >
            {#snippet button(apply, label, onclick, disabled)}<Button
                size="sm"
                color={apply ? 'primary' : 'alternative'}
                {onclick}
                {disabled}>{label}</Button
              >{/snippet}</TimePickerPanel
          >
        </Popover>
      {/if}
    {/snippet}
  </TemporalInput>
</ControlWrapper>
