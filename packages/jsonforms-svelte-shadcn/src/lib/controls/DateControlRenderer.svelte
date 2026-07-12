<script lang="ts">
  import {
    useJsonFormsControl,
    useJsonForms,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as NativeSelect from '$lib/components/ui/native-select';
  import * as Popover from '$lib/components/ui/popover';
  import { CalendarIcon, XIcon } from '@lucide/svelte';
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

  const minDate = $derived.by(() => {
    const datePickerProps = binding.shadcnProps('DatePicker');
    if (typeof datePickerProps.min === 'string') {
      return datePickerProps.min;
    }

    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMinimum === 'string') {
      return schema.formatMinimum;
    } else if (typeof schema.formatExclusiveMinimum === 'string') {
      let date = parseDateTime(schema.formatExclusiveMinimum, formats);
      if (date) {
        date = date.add(1, 'day');
      }
      return date ? date.format('YYYY-MM-DD') : schema.formatExclusiveMinimum;
    }
    return undefined;
  });

  const maxDate = $derived.by(() => {
    const datePickerProps = binding.shadcnProps('DatePicker');
    if (typeof datePickerProps.max === 'string') {
      return datePickerProps.max;
    }

    const schema = props.schema as AjvMinMaxFormat;
    if (typeof schema.formatMaximum === 'string') {
      return schema.formatMaximum;
    } else if (typeof schema.formatExclusiveMaximum === 'string') {
      let date = parseDateTime(schema.formatExclusiveMaximum, formats);
      if (date) {
        date = date.subtract(1, 'day');
      }
      return date ? date.format('YYYY-MM-DD') : schema.formatExclusiveMaximum;
    }
    return undefined;
  });

  const inputValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseDateTime(value, formats);
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
  const monthYearOnly = $derived.by(() => {
    const views = binding.appliedOptions.views;
    return (
      Array.isArray(views) &&
      views.includes('year') &&
      views.includes('month') &&
      !views.includes('day') &&
      !views.includes('date')
    );
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
      placeholder: binding.appliedOptions.placeholder ?? dateFormat,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });

  $effect(() => {
    if (showMenu) {
      selectedDate = pickerValue;
      calendarPlaceholder = pickerValue ?? calendarPlaceholder;
    }
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

    const date = parseDateTime(value, dateFormat);

    if (date) {
      value = date.format(dateSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
    const date = parseDateTime(value, 'YYYY-MM-DD');
    const nextValue = date ? date.format(dateSaveFormat) : null;

    if (adaptValue(nextValue) !== binding.control.data) {
      binding.onChange(nextValue);
    }
  }

  function updatePickerPart(part: 'year' | 'month', value: number) {
    const base = selectedDate ?? pickerValue ?? today(getLocalTimeZone());
    selectedDate = base.set({ [part]: value });
    calendarPlaceholder = selectedDate;
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
        aria-label={t.value('Choose date', 'Choose date')}
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
          aria-label={t.value('Clear value', 'Clear value')}
        >
          <XIcon class="h-4 w-4" />
        </Button>
      {/if}
    </div>
    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="w-auto space-y-4 p-2"
    >
      {#if monthYearOnly}
        <div class="grid min-w-72 grid-cols-2 gap-2 p-2">
          <NativeSelect.Root
            class="w-full"
            value={String((selectedDate ?? calendarPlaceholder).month)}
            aria-label={t.value('Month', 'Month')}
            onchange={(event) => updatePickerPart('month', Number(event.currentTarget.value))}
          >
            {#each selectableMonths as month (month.value)}
              <NativeSelect.Option value={String(month.value)}>{month.label}</NativeSelect.Option>
            {/each}
          </NativeSelect.Root>
          <NativeSelect.Root
            class="w-full"
            value={String((selectedDate ?? calendarPlaceholder).year)}
            aria-label={t.value('Year', 'Year')}
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
          disabled={!binding.control.enabled}
          captionLayout="dropdown"
          {locale}
          onValueChange={async (value: DateValue | undefined) => {
            selectedDate = value;
            calendarPlaceholder = value ?? calendarPlaceholder;

            if (showActions) {
              return;
            }

            showMenu = false;
            await tick();
            handlePickerChange(value?.toString() ?? null);
          }}
          {...binding.shadcnProps('Calendar')}
        />
      {/if}
      {#if showActions || monthYearOnly}
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
            onclick={() => {
              handlePickerChange(selectedDate?.toString() ?? null);
              showMenu = false;
            }}
            disabled={!selectedDate}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
</ControlWrapper>
