<script lang="ts">
  import Datepicker from './components/LocalizedDatepicker.svelte';
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
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { onMount, tick, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    parseDateTime,
    parseTemporalText,
    resolveTemporalBounds,
    formatTemporalProbe,
    useFlowbiteControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import CalendarClockOutline from '../components/CalendarClockOutline.svelte';
  import TimePicker from '../components/TimePicker.svelte';

  const JSON_SCHEMA_DATE_TIME_FORMATS = [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
  ];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: string };
    formatExclusiveMinimum?: string | { $data: string };
    formatMaximum?: string | { $data: string };
    formatExclusiveMaximum?: string | { $data: string };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let selectedDate = $state<Date | undefined>(undefined);
  let selectedTime = $state<string | undefined>(undefined);
  let showMenu = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
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

  $effect(() => {
    void showMenu;
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

  const adaptValue = (value: unknown) => value || clearValue;
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

  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      dateTimeSaveFormat,
      formatTemporalProbe(dateTimeSaveFormat),
    );
  });

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
      false,
    ),
  );

  const minDate = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableFrom === 'string') {
      return flowbiteProps.availableFrom;
    }

    return schemaBounds.min?.format('YYYY-MM-DD');
  });

  const maxDate = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableTo === 'string') {
      return flowbiteProps.availableTo;
    }

    return schemaBounds.max?.format('YYYY-MM-DD');
  });

  const activeDate = $derived.by(() => (showMenu ? selectedDate : pickerValue.date));

  const minTime = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.min === 'string') {
      return flowbiteProps.min;
    }

    const date = parseDateTime(activeDate, undefined);
    const bound = schemaBounds.min;
    return date && bound && date.isSame(bound, 'day')
      ? bound.format(useSeconds ? 'HH:mm:ss' : 'HH:mm')
      : undefined;
  });

  const maxTime = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Timepicker');
    if (typeof flowbiteProps.max === 'string') {
      return flowbiteProps.max;
    }

    const date = parseDateTime(activeDate, undefined);
    const bound = schemaBounds.max;
    return date && bound && date.isSame(bound, 'day')
      ? bound.format(useSeconds ? 'HH:mm:ss' : 'HH:mm')
      : undefined;
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseTemporalText(value, formats);
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

    const datetime = parseTemporalText(value, dateTimeFormat);

    if (datetime) {
      value = datetime.format(dateTimeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  const draftRangeError = $derived(getDraftRangeError(selectedDate, selectedTime));

  function getDraftRangeError(dateValue: Date | undefined, timeValue: string | undefined) {
    if (!restrict) return undefined;
    const date = parseDateTime(dateValue, undefined);
    const time = parseDateTime(
      timeValue ?? (useSeconds ? '00:00:00' : '00:00'),
      useSeconds ? 'HH:mm:ss' : 'HH:mm',
    );
    if (!date || !time) return undefined;
    const candidate = date
      .hour(time.hour())
      .minute(time.minute())
      .second(time.second())
      .millisecond(time.millisecond());
    const schema = boundsSchema as AjvMinMaxFormat;
    for (const keyword of [
      'formatMinimum',
      'formatMaximum',
      'formatExclusiveMinimum',
      'formatExclusiveMaximum',
    ] as const) {
      const rawBound = schema[keyword];
      if (typeof rawBound !== 'string') continue;
      const bound = parseDateTime(rawBound, formats);
      if (!bound) continue;
      const lower = keyword === 'formatMinimum' || keyword === 'formatExclusiveMinimum';
      const exclusive =
        keyword === 'formatExclusiveMinimum' || keyword === 'formatExclusiveMaximum';
      if (
        (lower ? candidate.isBefore(bound) : candidate.isAfter(bound)) ||
        (exclusive && candidate.isSame(bound))
      ) {
        return message('dateTime.outOfRange');
      }
    }
    return undefined;
  }

  function handlePickerChange(
    dateValue: Date | undefined,
    timeValue: string | undefined,
    updateInput: boolean = false,
  ) {
    if (schemaBounds.empty && restrict) return false;
    if (getDraftRangeError(dateValue, timeValue)) return false;
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
    return true;
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
      'aria-describedby':
        [
          flowbiteProps['aria-describedby'],
          showMenu && draftRangeError ? `${binding.control.id}-draft-range` : undefined,
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
  <div class="relative w-full">
    <Input {...inputProps}>
      {#snippet left()}
        <button
          type="button"
          id={menuId}
          class="pointer-events-auto m-0.5 rounded-sm p-0.5 whitespace-normal hover:bg-gray-100 focus:ring-1 focus:ring-gray-400 focus:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
          aria-label={message('temporal.openDateTime')}
          aria-haspopup="dialog"
          aria-expanded={showMenu}
          disabled={!binding.control.enabled || binding.control.readonly}
          tabindex={-1}
        >
          <CalendarClockOutline class="h-4 w-4" />
        </button>
        {#if popoverReady}
          <Popover
            arrow={false}
            class="pointer-events-auto w-auto"
            placement="bottom-start"
            bind:isOpen={showMenu}
            trigger="click"
          >
            <Datepicker
              locale={temporalForm.i18n?.locale}
              {...binding.flowbiteProps('Datepicker')}
              value={selectedDate ?? pickerValue.date}
              inline
              availableFrom={parseDateTime(minDate, 'YYYY-MM-DD')?.toDate()}
              availableTo={parseDateTime(maxDate, 'YYYY-MM-DD')?.toDate()}
              onselect={(value) => {
                selectedDate = value as Date;
                handlePickerChange(selectedDate, selectedTime);
              }}
              showActionButtons={false}
            ></Datepicker>
            <TimePicker
              views={binding.appliedOptions.views}
              disabled={!binding.control.enabled || schemaBounds.empty}
              value={selectedTime ?? pickerValue.time}
              min={minTime}
              max={maxTime}
              {useSeconds}
              {ampm}
              onchange={(value) => {
                selectedTime = value;
                handlePickerChange(selectedDate, value);
              }}
            ></TimePicker>

            {#if draftRangeError}
              <p id={`${binding.control.id}-draft-range`} role="alert">{draftRangeError}</p>
            {/if}
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
                    if (draftRangeError) return;
                    if (selectedDate && selectedTime) {
                      handlePickerChange(selectedDate, selectedTime, true);
                    }
                    showMenu = false;
                  }}
                  disabled={!selectedDate || !selectedTime || !!draftRangeError}>{okLabel}</Button
                >
              </div>
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
