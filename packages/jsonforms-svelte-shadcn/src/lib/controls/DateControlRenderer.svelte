<script lang="ts">
  import {
    useJsonForms,
    registerDetailDialogChange,
    useAuthoredConfig,
    temporalDateMode,
    warnTemporalSaveFormat,
    useTemporalDataBounds,
    temporalRestrict,
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
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import Calendar from './components/LocalizedCalendar.svelte';
  import * as NativeSelect from '@jsonforms-svelte-shadcn-ui/native-select';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { CalendarIcon, XIcon } from '$lib/components/icons';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import { tick } from 'svelte';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    getPortalTarget,
    parseDateTime,
    parseTemporalText,
    resolveTemporalBounds,
    formatTemporalProbe,
    temporalValueWithinBounds,
    useShadcnControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const JSON_SCHEMA_DATE_FORMATS = ['YYYY-MM-DD'];

  type AjvMinMaxFormat = {
    formatMinimum?: string | { $data: any };
    formatExclusiveMinimum?: string | { $data: any };
    formatMaximum?: string | { $data: any };
    formatExclusiveMaximum?: string | { $data: any };
  };

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  let showMenu = $state(false);
  let selectedDate = $state<DateValue | undefined>(undefined);
  let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));
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

  function toPickerDate(value?: string | null): DateValue | undefined {
    if (!value) return undefined;

    try {
      return parseDate(value);
    } catch {
      return undefined;
    }
  }

  const dateFormat = $derived.by(() => {
    const format = binding.appliedOptions.dateFormat;
    return typeof format === 'string'
      ? (expandLocaleFormat(format) ?? format)
      : (expandLocaleFormat('L') ?? 'YYYY-MM-DD');
  });

  const dateSaveFormat = $derived.by(() => {
    return typeof binding.appliedOptions.dateSaveFormat === 'string'
      ? binding.appliedOptions.dateSaveFormat
      : 'YYYY-MM-DD';
  });

  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      dateSaveFormat,
      formatTemporalProbe(dateSaveFormat),
    );
  });

  const formats = $derived([dateSaveFormat, dateFormat, ...JSON_SCHEMA_DATE_FORMATS]);

  const useMask = $derived(binding.appliedOptions.mask !== false);

  const maskOptions = $derived.by<MaskInputOptions | undefined>(() => {
    if (!useMask) return undefined;

    const state = convertDayjsToMaskaFormat(dateFormat);
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
    resolveTemporalBounds((restrict ? boundsSchema : {}) as AjvMinMaxFormat, formats, 'day', false),
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

  const inputValue = $derived.by(() => {
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const date = parseTemporalText(value, formats);
    return date ? date.format(dateFormat) : (value ?? '');
  });

  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseDateTime(value, formats);
    const pickerDate = toPickerDate(date ? date.format('YYYY-MM-DD') : undefined);
    return pickerDate;
  });

  const pickerMin = $derived.by(() => toPickerDate(minDate));
  const pickerMax = $derived.by(() => toPickerDate(maxDate));

  const cancelLabel = $derived.by(() => {
    const label = binding.appliedOptions.cancelLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.cancel');
  });

  const okLabel = $derived.by(() => {
    const label = binding.appliedOptions.okLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.ok');
  });

  const showActions = $derived.by(() => binding.appliedOptions.showActions === true);
  const dateMode = $derived(temporalDateMode(binding.appliedOptions.views, dateFormat));
  const monthYearOnly = $derived(dateMode !== 'date');
  const pickerRangeError = $derived.by(() => {
    if (!showMenu || !monthYearOnly || !selectedDate || !restrict) return undefined;
    const date = parseDateTime(selectedDate.toString(), 'YYYY-MM-DD');
    return !date || schemaBounds.empty || !temporalValueWithinBounds(date, schemaBounds, false)
      ? message('date.outOfRange')
      : undefined;
  });
  const selectableYears = $derived.by(() => {
    const currentYear = today(getLocalTimeZone()).year;
    const first = pickerMin?.year ?? currentYear - 100;
    const last = pickerMax?.year ?? currentYear + 100;
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  });
  const selectableMonths = $derived(
    Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, index, 1)),
    })),
  );

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
      placeholder: binding.appliedOptions.placeholder ?? dateFormat,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby':
        [
          shadcnProps['aria-describedby'],
          helpVisible ? `${binding.control.id}-help` : undefined,
          textDraft !== undefined ? `${binding.control.id}-draft-hint` : undefined,
          pickerRangeError ? `${binding.control.id}-draft-range` : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    };
  });

  $effect(() => {
    if (showMenu) {
      selectedDate = pickerValue;
      calendarPlaceholder = pickerValue ?? calendarPlaceholder;
    }
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

    const date = parseTemporalText(value, dateFormat);

    // A parseable paste can arrive before Maska's completion callback. Partial
    // text stays with this input instead of becoming invalid form data.
    if (value && !date && (!useMask || !maskState.completed)) {
      textDraft = value;
      return;
    }
    textDraft = undefined;

    if (date) {
      value = date.format(dateSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
    if (schemaBounds.empty) return;
    const date = parseDateTime(value, 'YYYY-MM-DD');
    if (date && !temporalValueWithinBounds(date, schemaBounds, false)) return;
    const nextValue = date ? date.format(dateSaveFormat) : null;

    if (adaptValue(nextValue) !== binding.control.data) {
      binding.onChange(nextValue);
    }
  }

  async function closeMenu() {
    showMenu = false;
    await tick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  function updatePickerPart(part: 'year' | 'month', value: number) {
    const base = selectedDate ?? pickerValue ?? today(getLocalTimeZone());
    selectedDate = base.set({ [part]: value });
    calendarPlaceholder = selectedDate;
    if (!showActions) handlePickerChange(selectedDate.toString());
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover.Root bind:open={showMenu} {...binding.shadcnProps('Popover')}>
    <div class="group relative w-full">
      <input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        use:maska={maskOptions}
      />

      <Popover.Trigger
        class="text-muted-foreground hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        aria-label={message('temporal.chooseDate')}
      >
        <CalendarIcon class="h-4 w-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="h-4 w-4" />
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
          bind:value={selectedDate}
          bind:placeholder={calendarPlaceholder}
          minValue={pickerMin}
          maxValue={pickerMax}
          captionLayout="dropdown"
          {locale}
          onValueChange={async (value: DateValue | undefined) => {
            selectedDate = value;
            calendarPlaceholder = value ?? calendarPlaceholder;

            if (showActions) {
              return;
            }

            await closeMenu();
            handlePickerChange(value?.toString() ?? null);
          }}
          {...binding.shadcnProps('Calendar')}
          disabled={!binding.control.enabled}
          readonly={binding.control.readonly}
        />
      {/if}
      {#if pickerRangeError}
        <p id={`${binding.control.id}-draft-range`} role="alert" class="text-destructive text-xs">
          {pickerRangeError}
        </p>
      {/if}
      {#if showActions}
        <div class="flex justify-center gap-2">
          <Button
            variant="outline"
            onclick={() => {
              selectedDate = pickerValue;
              showMenu = false;
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            onclick={async () => {
              if (pickerRangeError) return;
              await closeMenu();
              handlePickerChange(selectedDate?.toString() ?? null);
            }}
            disabled={!binding.control.enabled ||
              binding.control.readonly ||
              !selectedDate ||
              schemaBounds.empty ||
              !!pickerRangeError}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
  {#if textDraft !== undefined}
    <p id={`${binding.control.id}-draft-hint`} role="note" class="text-muted-foreground text-xs">
      {message('temporal.completeDate', { format: dateFormat })}
    </p>
  {/if}
</ControlWrapper>
