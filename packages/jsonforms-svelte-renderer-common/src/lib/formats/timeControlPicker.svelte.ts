import { parseDateTime, parseTemporalText, temporalValueWithinBounds } from './datejs';
import { timeValueWithinOffsetBounds } from './temporalOptions';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { useTemporalEditor } from './temporalEditor.svelte';

export function useTimeControlPicker(
  binding: Parameters<typeof useTemporalEditor>[1],
  adaptValue: Parameters<typeof useTemporalEditor>[2],
  localOptions: Parameters<typeof useTemporalEditor>[3],
  shouldCommit = (value: string | null) => adaptValue(value) !== binding.control.data,
  pickerOptions?: () => Record<string, unknown>,
) {
  const editor = useTemporalEditor('time', binding, adaptValue, localOptions);
  const message = useRendererMessages();
  let showMenu = $state(false);
  let rejectedRange = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
    if (!showMenu) rejectedRange = false;
  });

  const ampm = $derived(binding.appliedOptions.ampm === true);

  const minTime = $derived.by(() => {
    const configured = pickerOptions?.().min;
    if (typeof configured === 'string') return configured;
    if (offsetBounded) return undefined;
    return editor.bounds.min?.format(editor.useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const maxTime = $derived.by(() => {
    const configured = pickerOptions?.().max;
    if (typeof configured === 'string') return configured;
    if (offsetBounded) return undefined;
    return editor.bounds.max?.format(editor.useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const offsetBounded = $derived(
    editor.restrict && timeValueWithinOffsetBounds('00:00:00Z', editor.boundsSchema) !== undefined,
  );

  // The picker and displayed input must use the same local clock for stored
  // offset-bearing times. Bounds are parsed in that clock as well.
  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const parsed = parseTemporalText(value, editor.formats);
    return parsed?.format('HH:mm:ss') ?? value;
  });

  const showActions = $derived.by(() => binding.appliedOptions.showActions === true);
  const pickerRangeError = $derived(
    showMenu && rejectedRange ? message('time.outOfRange') : undefined,
  );

  function pickerTimeAllowed(value: string | undefined): boolean {
    if (!value || (!offsetBounded && editor.bounds.empty)) return false;
    const time = parseDateTime(value, editor.useSeconds ? 'HH:mm:ss' : 'HH:mm');
    if (!time) return false;
    if (offsetBounded) {
      return (
        timeValueWithinOffsetBounds(time.format(editor.saveFormat), editor.boundsSchema) ?? false
      );
    }
    return temporalValueWithinBounds(time, editor.bounds, true);
  }

  function handlePickerChange(value: string | null) {
    if (!pickerTimeAllowed(value ?? undefined)) return;
    const time = parseDateTime(value, editor.useSeconds ? 'HH:mm:ss' : 'HH:mm');
    const nextValue = time ? time.format(editor.saveFormat) : value;

    if (shouldCommit(nextValue)) binding.onChange(nextValue);
  }
  function canAccept(value: string | undefined) {
    return pickerTimeAllowed(value) && !rejectedRange;
  }
  const pickerProps = $derived({
    value: pickerValue,
    min: minTime,
    max: maxTime,
    isAllowed: pickerTimeAllowed,
    useSeconds: editor.useSeconds,
    ampm,
    onchange(value: string | null) {
      rejectedRange = false;
      if (!showActions) handlePickerChange(value);
    },
    onrejected() {
      rejectedRange = true;
    },
  });
  return {
    editor,
    get panelProps() {
      return {
        editor,
        controlId: binding.control.id,
        views: binding.appliedOptions.views,
        disabled:
          !binding.control.enabled ||
          !!binding.control.readonly ||
          (!offsetBounded && editor.bounds.empty),
      };
    },
    get pickerProps() {
      return pickerProps;
    },
    canAccept,
    accept(value: string | undefined) {
      if (value && canAccept(value)) {
        handlePickerChange(value);
        showMenu = false;
      }
    },
    cancel() {
      showMenu = false;
    },
    pickerTimeAllowed,
    handlePickerChange,
    get ampm() {
      return ampm;
    },
    get minTime() {
      return minTime;
    },
    get maxTime() {
      return maxTime;
    },
    get offsetBounded() {
      return offsetBounded;
    },
    get pickerValue() {
      return pickerValue;
    },
    get showActions() {
      return showActions;
    },
    get pickerRangeError() {
      return pickerRangeError;
    },
    get showMenu() {
      return showMenu;
    },
    get rejectedRange() {
      return rejectedRange;
    },
    set showMenu(value: boolean) {
      showMenu = value;
    },
    set rejectedRange(value: boolean) {
      rejectedRange = value;
    },
  };
}
