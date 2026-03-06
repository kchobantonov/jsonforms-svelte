<script lang="ts">
  import {
    useJsonFormsControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    getPortalRootNodeGetter,
    getPortalTarget,
    parseDateTime,
    useSkeletonControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const JSON_SCHEMA_TIME_FORMATS = ['HH:mm:ss.SSSZ', 'HH:mm:ss.SSS', 'HH:mm:ssZ', 'HH:mm:ss'];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: any };
    formatExclusiveMinimum?: string | { $data: any };
    formatMaximum?: string | { $data: any };
    formatExclusiveMaximum?: string | { $data: any };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  let showMenu = $state(false);
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);
  const t = useTranslator();

  const ampm = $derived(binding.appliedOptions.ampm === true);

  const timeFormat = $derived.by(() => {
    const format = binding.appliedOptions.timeFormat;
    return typeof format === 'string'
      ? (expandLocaleFormat(format) ?? format)
      : (expandLocaleFormat('LT') ?? 'H:mm');
  });

  const timeSaveFormat = $derived.by(() => {
    return typeof binding.appliedOptions.timeSaveFormat === 'string'
      ? binding.appliedOptions.timeSaveFormat
      : 'HH:mm:ssZ';
  });

  const formats = $derived([timeSaveFormat, timeFormat, ...JSON_SCHEMA_TIME_FORMATS]);
  const useSeconds = $derived(timeFormat.includes('s'));

  const useMask = $derived(binding.appliedOptions.mask !== false);

  const maskOptions = $derived.by<MaskInputOptions | undefined>(() => {
    if (!useMask) return undefined;

    const state = convertDayjsToMaskaFormat(timeFormat);
    return {
      mask: state.mask,
      tokens: state.tokens,
      tokensReplace: true,
      onMaska: (detail: MaskaDetail) => (maskState = detail),
    };
  });

  const minTime = $derived.by(() => {
    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMinimum === 'string') {
      const time = parseDateTime(schema.formatMinimum, formats);
      return time
        ? useSeconds
          ? time.format('HH:mm:ss')
          : time.format('HH:mm')
        : schema.formatMinimum;
    } else if (typeof schema.formatExclusiveMinimum === 'string') {
      let time = parseDateTime(schema.formatExclusiveMinimum, formats);
      if (time) {
        time = useSeconds ? time.add(1, 'second') : time.add(1, 'minute');
      }
      return time
        ? useSeconds
          ? time.format('HH:mm:ss')
          : time.format('HH:mm')
        : schema.formatExclusiveMinimum;
    }
    return undefined;
  });

  const maxTime = $derived.by(() => {
    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMaximum === 'string') {
      const time = parseDateTime(schema.formatMaximum, formats);
      return time
        ? useSeconds
          ? time.format('HH:mm:ss')
          : time.format('HH:mm')
        : schema.formatMaximum;
    } else if (typeof schema.formatExclusiveMaximum === 'string') {
      let time = parseDateTime(schema.formatExclusiveMaximum, formats);
      if (time) {
        time = useSeconds ? time.subtract(1, 'second') : time.subtract(1, 'minute');
      }
      return time
        ? useSeconds
          ? time.format('HH:mm:ss')
          : time.format('HH:mm')
        : schema.formatExclusiveMaximum;
    }
    return undefined;
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const time = parseDateTime(value, formats);
    return time ? time.format(timeFormat) : (value ?? '');
  });

  const cancelLabel = $derived.by(() => {
    const label =
      typeof binding.appliedOptions.cancelLabel === 'string'
        ? binding.appliedOptions.cancelLabel
        : 'Cancel';

    return t.value(label, label);
  });

  const okLabel = $derived.by(() => {
    const label =
      typeof binding.appliedOptions.okLabel === 'string' ? binding.appliedOptions.okLabel : 'OK';

    return t.value(label, label);
  });

  const showActions = $derived.by(() => binding.appliedOptions.showActions === true);

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'input w-full ps-10',
        binding.clearable ? 'pe-10' : 'pe-4',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? timeFormat,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });

  function handleInputChange(value: string | null) {
    if (useMask && !maskState.completed && value) {
      return;
    }

    if (value == null) {
      maskState = {
        masked: '',
        unmasked: '',
        completed: false,
      };
    }

    if (useMask && value === '' && maskState.unmasked === '') {
      return;
    }

    const time = parseDateTime(value, timeFormat);

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
    const time = parseDateTime(value, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    const nextValue = time ? time.format(timeSaveFormat) : value;

    if (adaptValue(nextValue) !== binding.control.data) {
      binding.onChange(nextValue);
    }
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    getRootNode={getRootNode}
    open={showMenu}
    onOpenChange={(details) => (showMenu = details.open)}
    positioning={{ placement: 'bottom-start' }}
  >
    <div class="group relative w-full">
      <input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        use:maska={maskOptions}
      />

      <Popover.Trigger
        class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-8 items-center justify-center"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        aria-label="Choose time"
      >
        <Clock3Icon class="h-4 w-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="h-4 w-4" />
        </button>
      {/if}
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content class="card preset-filled-surface-50-950 border-surface-200-800 w-auto border p-4 shadow-xl">
          <TimePicker
            value={binding.control.data}
            min={minTime}
            max={maxTime}
            {useSeconds}
            {ampm}
            onchange={(value) => !showActions && handlePickerChange(value)}
          >
            {#snippet actionSlot({ selectedTime })}
              {#if showActions}
                <div class="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    class="btn btn-sm preset-outlined"
                    onclick={() => {
                      showMenu = false;
                    }}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm preset-filled"
                    onclick={() => {
                      if (selectedTime) {
                        handlePickerChange(selectedTime);
                      }
                      showMenu = false;
                    }}
                    disabled={!selectedTime}
                  >
                    {okLabel}
                  </button>
                </div>
              {/if}
            {/snippet}
          </TimePicker>
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
</ControlWrapper>
