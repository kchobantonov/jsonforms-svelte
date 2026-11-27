import { untrack } from 'svelte';
import { useJsonFormsCell, type ControlProps } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { useInitialFocusRequest } from '../interaction/initialFocusDiagnostic.svelte';

export function useNumberFormatCell(props: ControlProps) {
  const binding = useJsonFormsCell(props);
  const message = useRendererMessages();
  const options = $derived({ ...binding.cell.config, ...binding.cell.uischema.options });
  const initialFocus = untrack(() => options.focus === true);
  const toFormatted = $derived(
    typeof options.toFormatted === 'function'
      ? (options.toFormatted as (value: number | undefined) => string)
      : undefined,
  );
  const fromFormatted = $derived(
    typeof options.fromFormatted === 'function'
      ? (options.fromFormatted as (value: string) => number | undefined)
      : undefined,
  );
  const hasFormatter = $derived(!!toFormatted && !!fromFormatted);
  useInitialFocusRequest(
    () => hasFormatter && initialFocus && binding.cell.visible && binding.cell.enabled,
    () => binding.cell.path,
  );
  let draft = $state<string | undefined>();
  let localError = $state('');
  let focused = $state(false);
  const errors = $derived([binding.cell.errors, localError].filter(Boolean).join('\n'));
  const helpMessage = $derived(
    errors ||
      (focused && typeof binding.cell.schema.description === 'string'
        ? binding.cell.schema.description
        : ''),
  );
  const helpId = $derived(`${binding.cell.id}-help`);
  let previousData = $state.raw(binding.cell.data);
  $effect(() => {
    const current = binding.cell.data;
    if (!Object.is(current, previousData)) {
      previousData = current;
      draft = undefined;
      localError = '';
    }
  });
  const display = $derived.by(() => {
    if (draft !== undefined) return draft;
    try {
      return (
        toFormatted?.(binding.cell.data as number | undefined) ?? String(binding.cell.data ?? '')
      );
    } catch {
      return String(binding.cell.data ?? '');
    }
  });
  function input(event: Event) {
    if (!binding.cell.enabled || !binding.cell.visible || binding.cell.readonly) return;
    const text = (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
    draft = text;
    try {
      const parsed = text === '' ? undefined : fromFormatted?.(text);
      if (text !== '' && parsed === undefined) {
        localError = message('numeric.integer');
        return;
      }
      if (parsed !== undefined && (!Number.isSafeInteger(parsed) || !Number.isFinite(parsed))) {
        localError = message('numeric.integer');
        return;
      }
      localError = '';
      binding.handleChange(binding.cell.path, parsed);
    } catch {
      localError = message('numeric.integer');
    }
  }

  function clear() {
    if (!binding.cell.enabled || !binding.cell.visible || binding.cell.readonly) return;
    draft = undefined;
    localError = '';
    binding.handleChange(binding.cell.path, undefined);
  }

  const inputProps = $derived({
    id: binding.cell.id,
    value: display,
    oninput: input,
    onblur() {
      focused = false;
      if (!localError) draft = undefined;
    },
    disabled: !binding.cell.enabled,
    readonly: binding.cell.readonly,
    'aria-invalid': !!errors,
    'aria-describedby': helpMessage ? helpId : undefined,
    onfocus() {
      focused = true;
    },
    autofocus: initialFocus,
    placeholder: typeof options.placeholder === 'string' ? options.placeholder : undefined,
    maxlength: binding.cell.schema.maxLength,
  });

  return {
    clear,
    get inputProps() {
      return inputProps;
    },
    get hasFormatter() {
      return hasFormatter;
    },
    get visible() {
      return binding.cell.visible;
    },
    get multiline() {
      return options.multi === true;
    },
    get errors() {
      return errors;
    },
    get helpMessage() {
      return helpMessage;
    },
    get helpId() {
      return helpId;
    },
    get clearable() {
      return (
        options.clearable !== false &&
        !binding.cell.readonly &&
        binding.cell.data !== undefined &&
        binding.cell.data !== null
      );
    },
    get clearLabel() {
      return message('control.clearValue');
    },
  };
}
