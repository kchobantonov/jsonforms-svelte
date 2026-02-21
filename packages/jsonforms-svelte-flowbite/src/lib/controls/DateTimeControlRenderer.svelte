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
    Datepicker,
    getTheme,
    Input,
    input as inputTheme,
    Popover,
    ToolbarButton,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    parseDateTime,
    useFlowbiteControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import CalendarClockOutline from './components/CalendarClockOutline.svelte';
  import TimePicker from './components/TimePicker.svelte';

  const JSON_SCHEMA_DATE_TIME_FORMATS = [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
  ];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: any };
    formatExclusiveMinimum?: string | { $data: any };
    formatMaximum?: string | { $data: any };
    formatExclusiveMaximum?: string | { $data: any };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let selectedDate = $state<Date | undefined>(undefined);
  let selectedTime = $state<string | undefined>(undefined);
  let showMenu = $state(false);

  $effect(() => {
    showMenu;
    // reset state

    untrack(() => {
      if (showMenu) {
        selectedDate = pickerValue.date;
        selectedTime = pickerValue.time;
      } else {
        selectedDate = undefined;
        selectedTime = undefined;
      }
    });
  });

  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  const t = useTranslator();

  const dateTimeFormat = $derived.by(() => {
    const format = binding.appliedOptions.dateTimeFormat;
    return typeof format === 'string'
      ? (expandLocaleFormat(format) ?? format)
      : (expandLocaleFormat('L LT') ?? 'YYYY-MM-DD HH:mm');
  });

  const dateTimeSaveFormat = $derived.by(() => {
    return typeof binding.appliedOptions.dateTimeSaveFormat === 'string'
      ? binding.appliedOptions.dateTimeSaveFormat
      : 'YYYY-MM-DDTHH:mm:ssZ';
  });

  const ampm = $derived(binding.appliedOptions.ampm === true);

  const formats = $derived([dateTimeSaveFormat, dateTimeFormat, ...JSON_SCHEMA_DATE_TIME_FORMATS]);
  const useSeconds = $derived(dateTimeFormat.includes('s'));

  const useMask = $derived(binding.appliedOptions.mask !== false);

  const maskOptions = $derived.by<MaskInputOptions | undefined>(() => {
    if (!useMask) return undefined;

    const state = convertDayjsToMaskaFormat(dateTimeFormat);
    return {
      mask: state.mask,
      tokens: state.tokens,
      tokensReplace: true,

      onMaska: (detail: MaskaDetail) => (maskState = detail),
    };
  });

  const minDate = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableFrom === 'string') {
      return flowbiteProps.availableFrom;
    }

    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMinimum === 'string') {
      const date = parseDateTime(schema.formatMinimum, formats);
      return date ? date.format('YYYY-MM-DD') : schema.formatMinimum;
    } else if (typeof schema.formatExclusiveMinimum === 'string') {
      let date = parseDateTime(schema.formatExclusiveMinimum, formats);
      if (date) {
        // the format is exclusive
        date = date.add(1, useSeconds ? 'second' : 'minutes');
      }
      return date ? date.format('YYYY-MM-DD') : schema.formatExclusiveMinimum;
    }
    return undefined;
  });

  const maxDate = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableTo === 'string') {
      return flowbiteProps.availableTo;
    }

    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMaximum === 'string') {
      const date = parseDateTime(schema.formatMaximum, formats);
      return date ? date.format('YYYY-MM-DD') : schema.formatMaximum;
    } else if (typeof schema.formatExclusiveMaximum === 'string') {
      let date = parseDateTime(schema.formatExclusiveMaximum, formats);
      if (date) {
        date = date.subtract(1, useSeconds ? 'second' : 'minutes');
      }
      return date ? date.format('YYYY-MM-DD') : schema.formatExclusiveMaximum;
    }
    return undefined;
  });

  const minTime = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.min === 'string') {
      return flowbiteProps.min;
    }

    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMinimum === 'string') {
      const time = parseDateTime(schema.formatMinimum, formats);

      const date = parseDateTime(pickerValue.date, 'YYYY-MM-DD');
      if (date && time && date.isSame(time, 'day')) {
        // time min only matters when it is the same day

        return useSeconds ? time.format('HH:mm:ss') : time.format('HH:mm');
      }
      return undefined;
    } else if (typeof schema.formatExclusiveMinimum === 'string') {
      let time = parseDateTime(schema.formatExclusiveMinimum, formats);
      const date = parseDateTime(pickerValue.date, 'YYYY-MM-DD');
      if (date && time) {
        if (time) {
          time = useSeconds ? time.add(1, 'second') : time.add(1, 'minute');
        }

        if (date.isSame(time, 'day')) {
          return useSeconds ? time.format('HH:mm:ss') : time.format('HH:mm');
        }
      }

      return undefined;
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
      const date = parseDateTime(pickerValue.date, 'YYYY-MM-DD');

      if (date && time && date.isSame(time, 'day')) {
        // time min only matters when it is the same day

        return useSeconds ? time.format('HH:mm:ss') : time.format('HH:mm');
      }

      return undefined;
    } else if (typeof schema.formatExclusiveMaximum === 'string') {
      let time = parseDateTime(schema.formatExclusiveMaximum, formats);
      const date = parseDateTime(pickerValue.date, 'YYYY-MM-DD');

      if (date && time) {
        if (time) {
          time = useSeconds ? time.subtract(1, 'second') : time.subtract(1, 'minute');
        }

        if (date.isSame(time, 'day')) {
          return useSeconds ? time.format('HH:mm:ss') : time.format('HH:mm');
        }
      }
      return undefined;
    }
    return undefined;
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseDateTime(value, formats);
    return date ? date.format(dateTimeFormat) : value;
  });

  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const dateTime = parseDateTime(value, formats);
    const date = dateTime ? dateTime.toDate() : undefined;

    const format = useSeconds ? 'HH:mm:ss' : 'HH:mm';
    const time = dateTime ? dateTime.format(format) : undefined;

    return { date, time };
  });

  const cancelLabel = $derived.by(() => {
    const label =
      typeof binding.appliedOptions.cancelLabel == 'string'
        ? binding.appliedOptions.cancelLabel
        : 'Cancel';

    return t.value(label, label);
  });

  const okLabel = $derived.by(() => {
    const label =
      typeof binding.appliedOptions.okLabel == 'string' ? binding.appliedOptions.okLabel : 'OK';

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

    const datetime = parseDateTime(value, dateTimeFormat);

    if (datetime) {
      value = datetime.format(dateTimeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(
    dateValue: Date | undefined,
    timeValue: string | undefined,
    updateInput: boolean = false,
  ) {
    const date = parseDateTime(dateValue, undefined);
    const time = parseDateTime(
      timeValue ?? (useSeconds ? '00:00:00' : '00:00'),
      useSeconds ? 'HH:mm:ss' : 'HH:mm',
    );

    let value: string | undefined = undefined;
    if (date && !time) {
      value = date!.format(dateTimeSaveFormat);
    } else if (date && time) {
      const combined = date
        .hour(time.hour())
        .minute(time.minute())
        .second(time.second())
        .millisecond(time.millisecond());

      value = combined.format(dateTimeSaveFormat);
    }
    if (!showActions || updateInput) {
      binding.onChange(value);
    }
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
      placeholder: binding.appliedOptions.placeholder ?? dateTimeFormat,
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
          <CalendarClockOutline class="h-4 w-4" />
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
      class="w-auto"
      placement="bottom-start"
      isOpen={showMenu}
      reference={`#${CSS.escape(inputProps.id)}`}
      triggeredBy={`#${CSS.escape(menuId)}`}
      trigger="click"
    >
      <Datepicker
        {...binding.flowbiteProps('Datepicker')}
        value={pickerValue.date}
        inline
        availableFrom={parseDateTime(minDate, formats)?.toDate()}
        availableTo={parseDateTime(maxDate, formats)?.toDate()}
        onselect={(value) => {
          handlePickerChange(value as Date, selectedTime);
          selectedDate = value as Date;
        }}
        showActionButtons={false}
      ></Datepicker>
      <TimePicker
        value={pickerValue.time}
        min={minTime}
        max={maxTime}
        {useSeconds}
        {ampm}
        onchange={(value) => {
          handlePickerChange(selectedDate, value);
          selectedTime = value;
        }}
      ></TimePicker>

      {#if showActions}
        <div class="mt-2 flex justify-center gap-2">
          <Button
            color="alternative"
            size="sm"
            onclick={() => {
              selectedDate = undefined;
              selectedTime = undefined;
              showMenu = false;
            }}>{cancelLabel}</Button
          >
          <Button
            size="sm"
            color="primary"
            onclick={() => {
              if (selectedDate && selectedTime) {
                handlePickerChange(selectedDate, selectedTime, true);
              }
              showMenu = false;
            }}
            disabled={!selectedDate || !selectedTime}>{okLabel}</Button
          >
        </div>
      {/if}
    </Popover>
  </div>
</ControlWrapper>
