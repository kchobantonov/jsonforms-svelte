<script lang="ts">
  import { TemporalNotice, TimePickerPanel } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TemporalPickerInput from './components/TemporalPickerInput.svelte';

  import {
    useTimeControlPicker,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    determineClearValue,
    getPortalRootNodeGetter,
    getPortalTarget,
    useSkeletonTextControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  const { binding, adaptValue } = useSkeletonTextControl(props, clearValue);
  const picker = useTimeControlPicker(binding, adaptValue, () => props.uischema.options);
  const inputAttributes = $derived(binding.skeletonProps('input'));
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    {getRootNode}
    open={picker.showMenu}
    onOpenChange={(details) => (picker.showMenu = details.open)}
    positioning={{ placement: 'bottom-start' }}
  >
    <div class="group relative w-full">
      <TemporalPickerInput
        {binding}
        editor={picker.editor}
        attributes={inputAttributes}
        kind="time"
        rangeError={!!picker.pickerRangeError}
      />
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 border-surface-200-800 max-h-[min(30rem,var(--available-height,30rem),calc(100dvh-2rem))] w-auto overflow-y-auto border p-4 shadow-xl"
        >
          <TimePickerPanel
            {TimePicker}
            {picker}
            {...picker.panelProps}
            actionClass="mt-4 flex justify-center gap-2"
            errorClass="text-error-500 dark:text-error-400 text-xs"
          >
            {#snippet button(apply, label, onclick, disabled)}<button
                type="button"
                class={apply ? 'btn btn-sm preset-filled' : 'btn btn-sm preset-outlined'}
                {onclick}
                {disabled}>{label}</button
              >{/snippet}</TimePickerPanel
          >
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
  <TemporalNotice
    {...picker.editor.hintNotice}
    class="text-surface-500 dark:text-surface-400 text-xs"
  />
</ControlWrapper>
