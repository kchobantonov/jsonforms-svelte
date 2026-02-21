<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
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
    ToolbarButton,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { ClockOutline } from 'flowbite-svelte-icons';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    parseDateTime,
    useFlowbiteControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  // using custom TimePicker not the one provided by svelte-flowbite for now since the one that is default uses input type time and rely on the browser to render that
  import TimePicker from './components/TimePicker.svelte';

  const JSON_SCHEMA_TIME_FORMATS = ['HH:mm:ss.SSSZ', 'HH:mm:ss.SSS', 'HH:mm:ssZ', 'HH:mm:ss'];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: any };
    formatExclusiveMinimum?: string | { $data: any };
    formatMaximum?: string | { $data: any };
    formatExclusiveMaximum?: string | { $data: any };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  let showMenu = $state(false);
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
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
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.min === 'string') {
      return flowbiteProps.min;
    }

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
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.max === 'string') {
      return flowbiteProps.max;
    }

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

    const time = parseDateTime(value, timeFormat);

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(val: string | null) {
    const time = parseDateTime(val, useSeconds ? 'HH:mm:ss' : 'HH:mm');
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

  const instanceId = counter++;
  const menuId = $derived(`${binding.control.id}-menu-${instanceId}`);

  const theme = $derived(getTheme('input'));

  const { close } = $derived(inputTheme());
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full">
    <Input {...inputProps}>
      {#snippet left()}
        <ToolbarButton
          id={menuId}
          size="sm"
          background={false}
          class="pointer-events-auto"
          onclick={() => (showMenu = !showMenu)}
          disabled={!binding.control.enabled}
          tabindex={-1}
        >
          <ClockOutline class="h-4 w-4" />
        </ToolbarButton>
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

        <CloseButton
          class={close({ class: clsx(theme?.close) })}
          disabled={!binding.control.enabled}
          color={inputProps.clearableColor}
          aria-label="Clear value"
        />
      {/snippet}
    </Input>
    <Popover
      arrow={false}
      class="w-auto p-3"
      placement="bottom-start"
      isOpen={showMenu}
      reference={`#${CSS.escape(inputProps.id)}`}
      triggeredBy={`#${CSS.escape(menuId)}`}
      trigger="click"
    >
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
                disabled={!selectedTime}>{okLabel}</Button
              >
            </div>
          {/if}
        {/snippet}
      </TimePicker>
    </Popover>
  </div>
</ControlWrapper>
