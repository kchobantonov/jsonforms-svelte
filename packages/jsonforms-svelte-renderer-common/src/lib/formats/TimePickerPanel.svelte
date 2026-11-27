<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { TimePickerProps } from './timePicker.svelte';
  import type { useTimeControlPicker } from './timeControlPicker.svelte';
  import type { useTemporalEditor } from './temporalEditor.svelte';
  import TemporalNotice from './TemporalNotice.svelte';
  const {
    picker,
    editor,
    controlId,
    views,
    disabled,
    resetOnOpen = true,
    TimePicker,
    button,
    actionClass,
    errorClass,
  }: {
    picker: ReturnType<typeof useTimeControlPicker>;
    editor: ReturnType<typeof useTemporalEditor>;
    controlId: string;
    views: unknown;
    disabled: boolean;
    resetOnOpen?: boolean;
    TimePicker: Component<TimePickerProps>;
    actionClass: string;
    errorClass: string;
    button: Snippet<[boolean, string, () => void, boolean]>;
  } = $props();
</script>

{#key resetOnOpen && picker.showMenu}
  <TimePicker {views} {disabled} {...picker.pickerProps}>
    {#snippet actionSlot({ selectedTime })}
      {#if picker.showActions}
        <div class={actionClass}>
          {@render button(false, editor.cancelLabel, picker.cancel, false)}
          {@render button(
            true,
            editor.okLabel,
            () => picker.accept(selectedTime),
            !picker.canAccept(selectedTime),
          )}
        </div>
      {/if}
    {/snippet}
  </TimePicker>
{/key}
<TemporalNotice {controlId} kind="range" text={picker.pickerRangeError} class={errorClass} />
