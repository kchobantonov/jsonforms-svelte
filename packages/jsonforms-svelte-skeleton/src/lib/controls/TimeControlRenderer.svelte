<script lang="ts">
  import {
    useJsonForms,
    temporalRestrict,
    warnTemporalSaveFormat,
    resolveTemporalDataBounds,
  } from '@chobantonov/jsonforms-svelte';
  const temporalForm = useJsonForms();
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
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
    parseTemporalText,
    resolveTemporalBounds,
    formatTemporalProbe,
    temporalValueWithinBounds,
    useSkeletonControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const JSON_SCHEMA_TIME_FORMATS = ['HH:mm:ss.SSSZ', 'HH:mm:ss.SSS', 'HH:mm:ssZ', 'HH:mm:ss'];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: string };
    formatExclusiveMinimum?: string | { $data: string };
    formatMaximum?: string | { $data: string };
    formatExclusiveMaximum?: string | { $data: string };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  let showMenu = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
  });
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: unknown) => value || clearValue;
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

  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      timeSaveFormat,
      formatTemporalProbe(timeSaveFormat),
    );
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

  const restrict = $derived(
    temporalRestrict(binding.control.uischema.options, binding.control.config),
  );
  const boundsSchema = $derived(
    resolveTemporalDataBounds(
      binding.control.schema as Record<string, unknown>,
      binding.control.path,
      temporalForm.core?.data,
    ),
  );
  const schemaBounds = $derived.by(() =>
    resolveTemporalBounds(
      (restrict ? boundsSchema : {}) as AjvMinMaxFormat,
      formats,
      useSeconds ? 'second' : 'minute',
      true,
    ),
  );

  const minTime = $derived.by(() => {
    return schemaBounds.min?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const maxTime = $derived.by(() => {
    return schemaBounds.max?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const time = parseTemporalText(value, formats);
    return time ? time.format(timeFormat) : (value ?? '');
  });

  const cancelLabel = $derived.by(() => {
    const label = binding.appliedOptions.cancelLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.cancel');
  });

  const okLabel = $derived.by(() => {
    const label = binding.appliedOptions.okLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.ok');
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
      readonly: binding.control.readonly,
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

    const time = parseTemporalText(value, timeFormat);

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
    if (schemaBounds.empty) return;
    const time = parseDateTime(value, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    if (time && !temporalValueWithinBounds(time, schemaBounds, true)) return;
    const nextValue = time ? time.format(timeSaveFormat) : value;

    if (adaptValue(nextValue) !== binding.control.data) {
      binding.onChange(nextValue);
    }
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    {getRootNode}
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
        disabled={!binding.control.enabled || binding.control.readonly}
        aria-label={message('temporal.chooseTime')}
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
          disabled={!binding.control.enabled || binding.control.readonly}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="h-4 w-4" />
        </button>
      {/if}
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 border-surface-200-800 w-auto border p-4 shadow-xl"
        >
          <TimePicker
            views={binding.appliedOptions.views}
            disabled={!binding.control.enabled || binding.control.readonly || schemaBounds.empty}
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
                    disabled={!selectedTime || schemaBounds.empty}
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
