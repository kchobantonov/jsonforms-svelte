<script lang="ts">
  import {
    useJsonForms,
    registerDetailDialogChange,
    useAuthoredConfig,
    warnTemporalSaveFormat,
    useUIDiagnosticReporter,
    useTemporalDataBounds,
    temporalRestrict,
    temporalTimeColumns,
    timeValueWithinOffsetBounds,
  } from '@chobantonov/jsonforms-svelte';
  const temporalForm = useJsonForms();
  const resolveBounds = useTemporalDataBounds();
  const authoredConfig = useAuthoredConfig();
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    useJsonFormsControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import clsx from 'clsx';
  import {
    Button,
    CloseButton,
    getTheme,
    Input,
    input as inputTheme,
    Popover,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { ClockOutline } from 'flowbite-svelte-icons';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { onMount, tick } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    parseDateTime,
    parseTemporalText,
    resolveTemporalBounds,
    formatTemporalProbe,
    temporalValueWithinBounds,
    useFlowbiteControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  // using custom TimePicker not the one provided by svelte-flowbite for now since the one that is default uses input type time and rely on the browser to render that
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

  let showMenu = $state(false);
  let rejectedRange = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
    if (!showMenu) rejectedRange = false;
  });
  let popoverReady = $state(false);

  onMount(() => {
    let active = true;
    void tick().then(() => {
      if (active) popoverReady = true;
    });
    return () => {
      active = false;
    };
  });
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: unknown) => value || clearValue;
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  let textDraft = $state<string | undefined>();
  // A partial temporal value exists only in this input; collection actions
  // must wait until it is completed or discarded instead of using stale data.
  registerDetailDialogChange({
    isBlocked: () => textDraft !== undefined,
    cancel: () => {
      textDraft = undefined;
    },
  });
  let observedData = binding.control.data;
  let observedPath = binding.control.path;
  let observedSchema = binding.control.schema;
  $effect(() => {
    const data = binding.control.data;
    const path = binding.control.path;
    const schema = binding.control.schema;
    if (
      data !== observedData ||
      path !== observedPath ||
      schema !== observedSchema ||
      !binding.control.enabled ||
      binding.control.readonly
    ) {
      observedData = data;
      observedPath = path;
      observedSchema = schema;
      textDraft = undefined;
    }
  });
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

  const reportedSaveFormats = new Set<string>();
  const reportDiagnostic = useUIDiagnosticReporter();
  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      timeSaveFormat,
      formatTemporalProbe(timeSaveFormat),
      binding.control.path,
      reportedSaveFormats,
      reportDiagnostic,
    );
  });

  const formats = $derived([timeSaveFormat, timeFormat, ...JSON_SCHEMA_TIME_FORMATS]);

  const useSeconds = $derived(
    timeFormat.includes('s') || temporalTimeColumns(binding.appliedOptions.views)?.seconds === true,
  );

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

  const restrict = $derived(temporalRestrict(props.uischema.options, authoredConfig.value));
  const boundsSchema = $derived(
    resolveBounds(
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
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.min === 'string') {
      return flowbiteProps.min;
    }

    if (offsetBounded) return undefined;

    return schemaBounds.min?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const maxTime = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.max === 'string') {
      return flowbiteProps.max;
    }

    if (offsetBounded) return undefined;

    return schemaBounds.max?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const offsetBounded = $derived(
    restrict && timeValueWithinOffsetBounds('00:00:00Z', boundsSchema) !== undefined,
  );

  const inputValue = $derived.by(() => {
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const time = parseTemporalText(value, formats);
    return time ? time.format(timeFormat) : (value ?? '');
  });

  // The picker and displayed input must use the same local clock for stored
  // offset-bearing times. Bounds are parsed in that clock as well.
  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const parsed = parseTemporalText(value, formats);
    return parsed?.format('HH:mm:ss') ?? value;
  });

  const cancelLabel = $derived.by(() => {
    const label = binding.appliedOptions.cancelLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.cancel');
  });

  const okLabel = $derived.by(() => {
    const label = binding.appliedOptions.okLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.ok');
  });

  const showActions = $derived.by(() => {
    return binding.appliedOptions.showActions === true;
  });
  const pickerRangeError = $derived(
    showMenu && rejectedRange ? message('time.outOfRange') : undefined,
  );

  function pickerTimeAllowed(value: string | undefined): boolean {
    if (!value || (!offsetBounded && schemaBounds.empty)) return false;
    const time = parseDateTime(value, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    if (!time) return false;
    if (offsetBounded) {
      return timeValueWithinOffsetBounds(time.format(timeSaveFormat), boundsSchema) ?? false;
    }
    return temporalValueWithinBounds(time, schemaBounds, true);
  }

  function handleInputChange(value: string | null) {
    if (!binding.control.enabled || binding.control.readonly) return;

    if (value == null) {
      // clear
      maskState.masked = '';
      maskState.unmasked = '';
      maskState.completed = false;
    }

    if (useMask && value === '' && maskState.unmasked === '') {
      // once cleared the maska will set the value to ''
      return;
    }

    const time = parseTemporalText(value, timeFormat);

    if (value && !time && (!useMask || !maskState.completed)) {
      textDraft = value;
      return;
    }
    textDraft = undefined;

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(val: string | null) {
    if (!pickerTimeAllowed(val ?? undefined)) return;
    const time = parseDateTime(val, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    binding.onChange(time ? time.format(timeSaveFormat) : val);
  }

  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));

    return {
      clearableColor: 'none' as CloseButtonProps['color'],

      ...flowbiteProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder ?? timeFormat,
      value: inputValue,
      clearable: binding.clearable,
      oninput: (e: Event) => handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => {
        handleInputChange(null);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby':
        [
          flowbiteProps['aria-describedby'],
          helpVisible ? `${binding.control.id}-help` : undefined,
          textDraft !== undefined ? `${binding.control.id}-draft-hint` : undefined,
          pickerRangeError ? `${binding.control.id}-draft-range` : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    };
  });

  const componentId = $props.id();
  const menuId = `${componentId}-menu`;

  const theme = $derived(getTheme('input'));

  const { close } = $derived(inputTheme());
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group/clear relative w-full">
    <Input {...inputProps}>
      {#snippet left()}
        <button
          type="button"
          id={menuId}
          class="pointer-events-auto m-0.5 rounded-sm p-0.5 whitespace-normal hover:bg-gray-100 focus:ring-1 focus:ring-gray-400 focus:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
          aria-label={message('temporal.openTime')}
          aria-haspopup="dialog"
          aria-expanded={showMenu}
          disabled={!binding.control.enabled || binding.control.readonly}
          tabindex={-1}
        >
          <ClockOutline class="h-4 w-4" />
        </button>
        {#if popoverReady}
          <Popover
            arrow={false}
            class="pointer-events-auto max-h-[min(30rem,calc(50dvh-2rem))] w-auto overflow-y-auto p-3"
            placement="bottom-start"
            bind:isOpen={showMenu}
            trigger="click"
          >
            <TimePicker
              views={binding.appliedOptions.views}
              disabled={!binding.control.enabled || (!offsetBounded && schemaBounds.empty)}
              value={pickerValue}
              min={minTime}
              max={maxTime}
              isAllowed={pickerTimeAllowed}
              {useSeconds}
              {ampm}
              onchange={(value) => {
                rejectedRange = false;
                if (!showActions) handlePickerChange(value);
              }}
              onrejected={() => (rejectedRange = true)}
            >
              {#snippet actionSlot({ selectedTime })}
                {#if showActions}
                  <div class="mt-2 flex justify-center gap-2">
                    <Button
                      color="alternative"
                      size="sm"
                      onclick={() => {
                        showMenu = false;
                      }}>{cancelLabel}</Button
                    >
                    <Button
                      size="sm"
                      color="primary"
                      onclick={() => {
                        if (selectedTime && pickerTimeAllowed(selectedTime) && !rejectedRange) {
                          handlePickerChange(selectedTime);
                          showMenu = false;
                        }
                      }}
                      disabled={!pickerTimeAllowed(selectedTime) || rejectedRange}>{okLabel}</Button
                    >
                  </div>
                {/if}
              {/snippet}
            </TimePicker>
            {#if pickerRangeError}
              <p
                id={`${binding.control.id}-draft-range`}
                role="alert"
                class="text-xs text-red-600 dark:text-red-400"
              >
                {pickerRangeError}
              </p>
            {/if}
          </Popover>
        {/if}
      {/snippet}
      {#snippet children(props)}
        <input
          {...props}
          class={twMerge(
            props.class,
            'ps-9',
            `${inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable ? 'pe-9' : ''}`,
          )}
          value={inputProps.value}
          oninput={inputProps.oninput}
          onfocus={inputProps.onfocus}
          onblur={inputProps.onblur}
          use:maska={maskOptions}
        />

        {#if inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable}
          <CloseButton
            class={twMerge(
              close({ class: clsx(theme?.close) }),
              'invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible',
            )}
            disabled={!binding.control.enabled || binding.control.readonly}
            color={inputProps.clearableColor}
            ariaLabel={message('control.clearValue')}
            name={message('control.clearValue')}
          />
        {/if}
      {/snippet}
    </Input>
  </div>
  {#if textDraft !== undefined}
    <p
      id={`${binding.control.id}-draft-hint`}
      role="note"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      {message('temporal.completeTime', { format: timeFormat })}
    </p>
  {/if}
</ControlWrapper>
