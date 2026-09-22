<script lang="ts">
  import {
    useJsonFormsControl,
    useJsonForms,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { CalendarClockIcon, XIcon } from '$lib/components/icons';
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Calendar } from '@jsonforms-svelte-shadcn-ui/calendar';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import TimePicker from '../components/TimePicker.svelte';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    getPortalTarget,
    parseDateTime,
    parseTemporalText,
    resolveTemporalBounds,
    useShadcnControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

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
  let selectedDate = $state<DateValue | undefined>(undefined);
  let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));
  let selectedTime = $state<string | undefined>(undefined);
  let showMenu = $state(false);
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);
  const t = useTranslator();
  const jsonforms = useJsonForms();
  const locale = $derived(jsonforms.i18n?.locale ?? 'en-US');

  function toPickerDate(value?: string | null): DateValue | undefined {
    if (!value) return undefined;

    try {
      return parseDate(value);
    } catch {
      return undefined;
    }
  }

  $effect(() => {
    const open = showMenu;

    untrack(() => {
      if (open) {
        selectedDate = pickerValue.date;
        calendarPlaceholder = pickerValue.date ?? calendarPlaceholder;
        selectedTime = pickerValue.time;
      } else {
        selectedDate = undefined;
        selectedTime = undefined;
      }
    });
  });

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

  const schemaBounds = $derived.by(() =>
    resolveTemporalBounds(
      binding.control.schema as AjvMinMaxFormat,
      formats,
      useSeconds ? 'second' : 'minute',
      false,
    ),
  );

  const minDate = $derived.by(() => {
    const datePickerProps = binding.shadcnProps('DatePicker');
    if (typeof datePickerProps.min === 'string') {
      return datePickerProps.min;
    }

    return schemaBounds.min?.format('YYYY-MM-DD');
  });

  const maxDate = $derived.by(() => {
    const datePickerProps = binding.shadcnProps('DatePicker');
    if (typeof datePickerProps.max === 'string') {
      return datePickerProps.max;
    }

    return schemaBounds.max?.format('YYYY-MM-DD');
  });

  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const dateTime = parseDateTime(value, formats);
    const date = toPickerDate(dateTime ? dateTime.format('YYYY-MM-DD') : undefined);
    const time = dateTime ? dateTime.format(useSeconds ? 'HH:mm:ss' : 'HH:mm') : undefined;

    return {
      date,
      time,
    };
  });

  const activeDate = $derived.by(() => {
    const current = showMenu ? selectedDate : pickerValue.date;
    return current ? parseDateTime(current.toString(), 'YYYY-MM-DD') : undefined;
  });

  const minTime = $derived.by(() => {
    const date = activeDate;
    const bound = schemaBounds.min;
    return date && bound && date.isSame(bound, 'day')
      ? bound.format(useSeconds ? 'HH:mm:ss' : 'HH:mm')
      : undefined;
  });

  const maxTime = $derived.by(() => {
    const date = activeDate;
    const bound = schemaBounds.max;
    return date && bound && date.isSame(bound, 'day')
      ? bound.format(useSeconds ? 'HH:mm:ss' : 'HH:mm')
      : undefined;
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseTemporalText(value, formats);
    return date ? date.format(dateTimeFormat) : (value ?? '');
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
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        'input w-full ps-10',
        binding.clearable ? 'pe-10' : 'pe-4',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? dateTimeFormat,
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

    const datetime = parseTemporalText(value, dateTimeFormat);

    if (datetime) {
      value = datetime.format(dateTimeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  const draftRangeError = $derived(getDraftRangeError(selectedDate, selectedTime));

  function getDraftRangeError(dateValue: DateValue | undefined, timeValue: string | undefined) {
    if (binding.appliedOptions.restrict === false) return undefined;
    const date = parseDateTime(dateValue?.toString(), 'YYYY-MM-DD');
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
    const schema = binding.control.schema as AjvMinMaxFormat;
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
        return t.value('dateTime.outOfRange', 'Select a date and time within the allowed range.');
      }
    }
    return undefined;
  }

  function handlePickerChange(
    dateValue: DateValue | undefined,
    timeValue: string | undefined,
    updateInput: boolean = false,
  ) {
    if (schemaBounds.empty && binding.appliedOptions.restrict !== false) return false;
    if (getDraftRangeError(dateValue, timeValue)) return false;
    const date = parseDateTime(dateValue?.toString(), 'YYYY-MM-DD');
    const time = parseDateTime(
      timeValue ?? (useSeconds ? '00:00:00' : '00:00'),
      useSeconds ? 'HH:mm:ss' : 'HH:mm',
    );

    let value: string | undefined = undefined;
    if (date && !time) {
      value = date.format(dateTimeSaveFormat);
    } else if (date && time) {
      value = date
        .hour(time.hour())
        .minute(time.minute())
        .second(time.second())
        .millisecond(time.millisecond())
        .format(dateTimeSaveFormat);
    }

    if (!showActions || updateInput) {
      if (adaptValue(value) !== binding.control.data) {
        binding.onChange(value);
      }
    }
    return true;
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover.Root bind:open={showMenu} {...binding.shadcnProps('Popover')}>
    <div class="group relative w-full">
      <input
        {...inputProps}
        oninput={(event: Event) => handleInputChange((event.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        use:maska={maskOptions}
      />
      <Popover.Trigger
        class="text-muted-foreground hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
        disabled={!binding.control.enabled}
        aria-label={t.value('Choose date and time', 'Choose date and time')}
      >
        <CalendarClockIcon class="size-4" />
      </Popover.Trigger>
      {#if binding.clearable && inputValue}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled}
          aria-label={t.value('Clear value', 'Clear value')}
        >
          <XIcon />
        </Button>
      {/if}
    </div>

    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="w-auto space-y-4 p-2"
    >
      <Calendar
        type="single"
        value={selectedDate}
        bind:placeholder={calendarPlaceholder}
        minValue={toPickerDate(minDate)}
        maxValue={toPickerDate(maxDate)}
        disabled={!binding.control.enabled}
        captionLayout="dropdown"
        {locale}
        onValueChange={(value: DateValue | undefined) => {
          selectedDate = value;
          calendarPlaceholder = value ?? calendarPlaceholder;

          if (showActions) {
            return;
          }

          if (handlePickerChange(value, selectedTime)) showMenu = false;
        }}
        {...binding.shadcnProps('Calendar')}
      />
      <TimePicker
        disabled={!binding.control.enabled || schemaBounds.empty}
        value={selectedTime ?? pickerValue.time}
        min={minTime}
        max={maxTime}
        {useSeconds}
        {ampm}
        onchange={(value) => {
          selectedTime = value;
          if (!showActions) handlePickerChange(selectedDate, value);
        }}
      />
      {#if draftRangeError}
        <p role="alert">{draftRangeError}</p>
      {/if}
      {#if showActions}
        <div class="flex justify-center gap-2">
          <Button variant="outline" size="sm" onclick={() => (showMenu = false)}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            disabled={!selectedDate || !selectedTime || !!draftRangeError}
            onclick={() => {
              if (draftRangeError) return;
              handlePickerChange(selectedDate, selectedTime, true);
              showMenu = false;
            }}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
</ControlWrapper>
