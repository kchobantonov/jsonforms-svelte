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
    temporalDateMode,
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
  import { CalendarClockIcon, XIcon } from '$lib/components/icons';
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as NativeSelect from '@jsonforms-svelte-shadcn-ui/native-select';
  import Calendar from './components/LocalizedCalendar.svelte';
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
    resolvePickerDateTimeCandidate,
    resolveTemporalBounds,
    formatTemporalProbe,
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
  let rejectedTime = $state(false);
  $effect(() => {
    if (!showMenu) rejectedTime = false;
  });
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);
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
  const jsonforms = useJsonForms();
  const locale = $derived(jsonforms.i18n?.locale ?? 'en-US');
  let openedData: unknown;
  $effect(() => {
    const currentData = binding.control.data;
    if (!showMenu) {
      openedData = currentData;
    } else if (showActions && currentData !== openedData) {
      // A host replacement invalidates a staged picker draft.
      showMenu = false;
    }
  });

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
        selectedDate = pickerValue.date ?? (monthYearOnly ? today(getLocalTimeZone()) : undefined);
        calendarPlaceholder = pickerValue.date ?? calendarPlaceholder;
        selectedTime =
          pickerValue.time ?? (monthYearOnly ? (useSeconds ? '00:00:00' : '00:00') : undefined);
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

  const dateMode = $derived(temporalDateMode(binding.appliedOptions.views, dateTimeFormat));
  const monthYearOnly = $derived(dateMode !== 'date');
  const selectableYears = $derived.by(() => {
    const currentYear = today(getLocalTimeZone()).year;
    const first = toPickerDate(minDate)?.year ?? currentYear - 100;
    const last = toPickerDate(maxDate)?.year ?? currentYear + 100;
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
  });
  const selectableMonths = $derived(
    Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, index, 1)),
    })),
  );

  function updatePickerPart(part: 'year' | 'month', value: number) {
    const base = selectedDate ?? pickerValue.date ?? today(getLocalTimeZone());
    rejectedTime = false;
    selectedDate = base.set({ [part]: value });
    calendarPlaceholder = selectedDate;
    if (!showActions) handlePickerChange(selectedDate, selectedTime);
  }

  const ampm = $derived(binding.appliedOptions.ampm === true);
  const reportedSaveFormats = new Set<string>();
  const reportDiagnostic = useUIDiagnosticReporter();
  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      dateTimeSaveFormat,
      formatTemporalProbe(dateTimeSaveFormat),
      binding.control.path,
      reportedSaveFormats,
      reportDiagnostic,
    );
  });

  const formats = $derived([dateTimeSaveFormat, dateTimeFormat, ...JSON_SCHEMA_DATE_TIME_FORMATS]);
  const useSeconds = $derived(
    dateTimeFormat.includes('s') ||
      temporalTimeColumns(binding.appliedOptions.views)?.seconds === true,
  );
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
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const date = parseTemporalText(value, formats);
    return date ? date.format(dateTimeFormat) : (value ?? '');
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
    const shadcnProps = binding.shadcnProps('input');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));

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
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder ?? dateTimeFormat,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby':
        [
          shadcnProps['aria-describedby'],
          helpVisible ? `${binding.control.id}-help` : undefined,
          textDraft !== undefined ? `${binding.control.id}-draft-hint` : undefined,
          showMenu && draftRangeError ? `${binding.control.id}-draft-range` : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    };
  });

  function handleInputChange(value: string | null) {
    if (!binding.control.enabled || binding.control.readonly) return;
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

    if (value && !datetime && (!useMask || !maskState.completed)) {
      textDraft = value;
      return;
    }
    textDraft = undefined;

    if (datetime) {
      value = datetime.format(dateTimeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  const draftRangeError = $derived(
    getDraftRangeError(selectedDate, selectedTime) ??
      (rejectedTime ? message('dateTime.outOfRange') : undefined),
  );

  function getDraftRangeError(dateValue: DateValue | undefined, timeValue: string | undefined) {
    if (!restrict) return undefined;
    const date = parseDateTime(dateValue?.toString(), 'YYYY-MM-DD');
    const time = parseDateTime(
      timeValue ?? (useSeconds ? '00:00:00' : '00:00'),
      useSeconds ? 'HH:mm:ss' : 'HH:mm',
    );
    if (!date || !time) return undefined;
    const candidate = resolvePickerDateTimeCandidate(date, time, binding.control.data, formats);
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
    dateValue: DateValue | undefined,
    timeValue: string | undefined,
    updateInput: boolean = false,
  ) {
    if (schemaBounds.empty && restrict) return false;
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
      value = resolvePickerDateTimeCandidate(date, time, binding.control.data, formats).format(
        dateTimeSaveFormat,
      );
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
        aria-label={message('temporal.chooseDateTime')}
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
          aria-label={message('control.clearValue')}
        >
          <XIcon />
        </Button>
      {/if}
    </div>

    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="max-h-[min(30rem,var(--bits-popover-content-available-height,30rem),calc(100dvh-2rem))] w-auto space-y-4 overflow-y-auto p-2"
    >
      {#if monthYearOnly}
        <div class="grid min-w-72 grid-cols-2 gap-2 p-2">
          {#if dateMode === 'month'}
            <NativeSelect.Root
              disabled={!binding.control.enabled || binding.control.readonly}
              class="w-full"
              value={String((selectedDate ?? calendarPlaceholder).month)}
              aria-label={message('temporal.month')}
              onchange={(event) => updatePickerPart('month', Number(event.currentTarget.value))}
            >
              {#each selectableMonths as month (month.value)}
                <NativeSelect.Option value={String(month.value)}>{month.label}</NativeSelect.Option>
              {/each}
            </NativeSelect.Root>
          {/if}
          <NativeSelect.Root
            disabled={!binding.control.enabled || binding.control.readonly}
            class="w-full"
            value={String((selectedDate ?? calendarPlaceholder).year)}
            aria-label={message('temporal.year')}
            onchange={(event) => updatePickerPart('year', Number(event.currentTarget.value))}
          >
            {#each selectableYears as year (year)}
              <NativeSelect.Option value={String(year)}>{year}</NativeSelect.Option>
            {/each}
          </NativeSelect.Root>
        </div>
      {:else}
        <Calendar
          type="single"
          value={selectedDate}
          bind:placeholder={calendarPlaceholder}
          minValue={toPickerDate(minDate)}
          maxValue={toPickerDate(maxDate)}
          captionLayout="dropdown"
          {locale}
          onValueChange={(value: DateValue | undefined) => {
            rejectedTime = false;
            selectedDate = value;
            calendarPlaceholder = value ?? calendarPlaceholder;

            if (showActions) {
              return;
            }

            if (handlePickerChange(value, selectedTime)) showMenu = false;
          }}
          {...binding.shadcnProps('Calendar')}
          disabled={!binding.control.enabled}
          readonly={binding.control.readonly}
        />
      {/if}
      <TimePicker
        views={binding.appliedOptions.views}
        disabled={!binding.control.enabled || binding.control.readonly || schemaBounds.empty}
        value={selectedTime ?? pickerValue.time}
        min={minTime}
        max={maxTime}
        {useSeconds}
        {ampm}
        onchange={(value) => {
          rejectedTime = false;
          selectedTime = value;
          if (!showActions) handlePickerChange(selectedDate, value);
        }}
        onrejected={() => (rejectedTime = true)}
      />
      {#if draftRangeError}
        <p id={`${binding.control.id}-draft-range`} role="alert" class="text-destructive text-xs">
          {draftRangeError}
        </p>
      {/if}
      {#if showActions}
        <div class="flex justify-center gap-2">
          <Button variant="outline" size="sm" onclick={() => (showMenu = false)}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            disabled={binding.control.readonly ||
              !selectedDate ||
              !selectedTime ||
              !!draftRangeError}
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
  {#if textDraft !== undefined}
    <p id={`${binding.control.id}-draft-hint`} role="note" class="text-muted-foreground text-xs">
      {message('temporal.completeDateTime', { format: dateTimeFormat })}
    </p>
  {/if}
</ControlWrapper>
