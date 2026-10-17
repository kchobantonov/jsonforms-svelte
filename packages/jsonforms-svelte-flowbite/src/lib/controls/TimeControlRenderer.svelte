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
  $effect(() => {
    if (binding.control.readonly || !binding.control.enabled) showMenu = false;
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
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.min === 'string') {
      return flowbiteProps.min;
    }

    return schemaBounds.min?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const maxTime = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.max === 'string') {
      return flowbiteProps.max;
    }

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

  const showActions = $derived.by(() => {
    return binding.appliedOptions.showActions === true;
  });

  function handleInputChange(value: string | null) {
    if (useMask && !maskState.completed && value) {
      // the value is set not not yet completed so do not set that until the full mask is completed
      // otherwise if the control.data is bound to another renderer with different dateTimeFormat then those will collide
      return;
    }

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

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(val: string | null) {
    if (schemaBounds.empty) return;
    const time = parseDateTime(val, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    if (time && !temporalValueWithinBounds(time, schemaBounds, true)) return;
    binding.onChange(time ? time.format(timeSaveFormat) : val);
  }

  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

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
      autofocus: binding.appliedOptions.focus,
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
    };
  });

  const componentId = $props.id();
  const menuId = `${componentId}-menu`;

  const theme = $derived(getTheme('input'));

  const { close } = $derived(inputTheme());
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full">
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
            class="pointer-events-auto w-auto p-3"
            placement="bottom-start"
            bind:isOpen={showMenu}
            trigger="click"
          >
            <TimePicker
              views={binding.appliedOptions.views}
              disabled={!binding.control.enabled || schemaBounds.empty}
              value={binding.control.data}
              min={minTime}
              max={maxTime}
              {useSeconds}
              {ampm}
              onchange={(value) => !showActions && handlePickerChange(value)}
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
                        if (selectedTime) {
                          handlePickerChange(selectedTime);
                        }
                        showMenu = false;
                      }}
                      disabled={!selectedTime || schemaBounds.empty}>{okLabel}</Button
                    >
                  </div>
                {/if}
              {/snippet}
            </TimePicker>
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
            class={close({ class: clsx(theme?.close) })}
            disabled={!binding.control.enabled || binding.control.readonly}
            color={inputProps.clearableColor}
            ariaLabel={message('control.clearValue')}
            name={message('control.clearValue')}
          />
        {/if}
      {/snippet}
    </Input>
  </div>
</ControlWrapper>
