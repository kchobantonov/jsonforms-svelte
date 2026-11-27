<script lang="ts">
  import { TemporalNotice, TimePickerPanel } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TemporalPickerInput from './components/TemporalPickerInput.svelte';

  import PopoverContent from '../components/PopoverContent.svelte';
  import {
    useTimeControlPicker,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { determineClearValue, useShadcnTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const { binding, adaptValue } = useShadcnTextControl(props, clearValue);
  const picker = useTimeControlPicker(binding, adaptValue, () => props.uischema.options);
  const inputAttributes = $derived(binding.shadcnProps('input'));
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover.Root {...binding.shadcnProps('Popover')} bind:open={picker.showMenu}>
    <div class="group relative w-full">
      <TemporalPickerInput
        {binding}
        editor={picker.editor}
        attributes={inputAttributes}
        kind="time"
        rangeError={!!picker.pickerRangeError}
      />
    </div>

    <PopoverContent
      align="start"
      class="max-h-[min(30rem,var(--bits-popover-content-available-height,30rem),calc(100dvh-2rem))] w-auto overflow-y-auto p-4"
    >
      <TimePickerPanel
        {TimePicker}
        {picker}
        {...picker.panelProps}
        actionClass="mt-4 flex justify-center gap-2"
        errorClass="text-destructive text-xs"
      >
        {#snippet button(apply, label, onclick, disabled)}<Button
            size="sm"
            variant={apply ? 'default' : 'outline'}
            {onclick}
            {disabled}>{label}</Button
          >{/snippet}</TimePickerPanel
      >
    </PopoverContent>
  </Popover.Root>
  <TemporalNotice {...picker.editor.hintNotice} class="text-muted-foreground text-xs" />
</ControlWrapper>
