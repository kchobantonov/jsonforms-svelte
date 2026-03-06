<script lang="ts">
  import {
    useJsonFormsControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { DatePicker, Portal, parseDate, type DateValue } from '@skeletonlabs/skeleton-svelte';
  import { CalendarIcon, XIcon } from '@lucide/svelte';
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
    useSkeletonControl,
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
  const getRootNode = getPortalRootNodeGetter();

  let showMenu = $state(false);
  let selectedDate = $state<DateValue[]>([]);
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);
  const t = useTranslator();

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
    const datePickerProps = binding.skeletonProps('DatePicker');
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
    const datePickerProps = binding.skeletonProps('DatePicker');
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
    return pickerDate ? [pickerDate] : [];
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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? dateFormat,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });

  const datePickerProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('DatePicker');

    return {
      ...skeletonProps,
      value: showActions ? selectedDate : pickerValue,
      open: showMenu,
      min: pickerMin,
      max: pickerMax,
      closeOnSelect: !showActions,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      required: binding.control.required,
      positioning: {
        placement: 'bottom-start' as const,
        offset: { mainAxis: 4, crossAxis: 0 },
        shift: 0,
      },
      onOpenChange: (details: { open: boolean }) => {
        showMenu = details.open;
      },
      onValueChange: (details: { value: DateValue[]; valueAsString: string[] }) => {
        if (showActions) {
          selectedDate = details.value;
          return;
        }

        handlePickerChange(details.value[0]?.toString() ?? null);
        showMenu = false;
      },
    };
  });

  $effect(() => {
    if (showMenu) {
      selectedDate = [...pickerValue];
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
</script>

<ControlWrapper {...binding.controlWrapper}>
  <DatePicker {...datePickerProps}>
    <DatePicker.Control class="group relative w-full">
      <input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        use:maska={maskOptions}
      />

      <DatePicker.Trigger
        class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        aria-label="Choose date"
      >
        <CalendarIcon class="h-4 w-4" />
      </DatePicker.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="h-4 w-4" />
        </button>
      {/if}
    </DatePicker.Control>

    <Portal target={getPortalTarget()}>
      <DatePicker.Positioner>
        <DatePicker.Content
          class="card preset-filled-surface-50-950 w-[22rem] space-y-4 p-4 shadow-xl"
        >
          <DatePicker.View view="day">
            <DatePicker.Context>
              {#snippet children(datePicker)}
                <DatePicker.ViewControl class="mb-2 flex items-center gap-2">
                  <DatePicker.PrevTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                  <DatePicker.ViewTrigger
                    class="hover:preset-tonal rounded-base text-surface-950-50 inline-flex h-8 flex-1 items-center justify-center border-0 bg-transparent px-3 text-sm font-medium shadow-none"
                  >
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                </DatePicker.ViewControl>
                <DatePicker.Table class="w-full border-collapse">
                  <DatePicker.TableHead>
                    <DatePicker.TableRow>
                      {#each datePicker().weekDays as weekDay, id (id)}
                        <DatePicker.TableHeader
                          class="text-surface-600-400 pb-2 text-center text-xs font-medium"
                        >
                          {weekDay.short}
                        </DatePicker.TableHeader>
                      {/each}
                    </DatePicker.TableRow>
                  </DatePicker.TableHead>
                  <DatePicker.TableBody>
                    {#each datePicker().weeks as week, id (id)}
                      <DatePicker.TableRow>
                        {#each week as day, id (id)}
                          <DatePicker.TableCell value={day} class="p-1 text-center align-middle">
                            <DatePicker.TableCellTrigger
                              class="hover:preset-tonal data-[selected]:preset-filled-primary-500 data-[today]:preset-outlined-primary-500 rounded-base inline-flex size-9 items-center justify-center text-sm"
                            >
                              {day.day}
                            </DatePicker.TableCellTrigger>
                          </DatePicker.TableCell>
                        {/each}
                      </DatePicker.TableRow>
                    {/each}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              {/snippet}
            </DatePicker.Context>
          </DatePicker.View>

          <DatePicker.View view="month">
            <DatePicker.Context>
              {#snippet children(datePicker)}
                <DatePicker.ViewControl class="mb-2 flex items-center gap-2">
                  <DatePicker.PrevTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                  <DatePicker.ViewTrigger
                    class="hover:preset-tonal rounded-base text-surface-950-50 inline-flex h-8 flex-1 items-center justify-center border-0 bg-transparent px-3 text-sm font-medium shadow-none"
                  >
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                </DatePicker.ViewControl>
                <DatePicker.Table class="w-full border-collapse">
                  <DatePicker.TableBody>
                    {#each datePicker().getMonthsGrid( { columns: 4, format: 'short' }, ) as months, id (id)}
                      <DatePicker.TableRow>
                        {#each months as month, id (id)}
                          <DatePicker.TableCell
                            value={month.value}
                            class="p-1 text-center align-middle"
                          >
                            <DatePicker.TableCellTrigger
                              class="hover:preset-tonal data-[selected]:preset-filled-primary-500 rounded-base inline-flex h-10 w-full items-center justify-center text-sm"
                            >
                              {month.label}
                            </DatePicker.TableCellTrigger>
                          </DatePicker.TableCell>
                        {/each}
                      </DatePicker.TableRow>
                    {/each}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              {/snippet}
            </DatePicker.Context>
          </DatePicker.View>

          <DatePicker.View view="year">
            <DatePicker.Context>
              {#snippet children(datePicker)}
                <DatePicker.ViewControl class="mb-2 flex items-center gap-2">
                  <DatePicker.PrevTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                  <DatePicker.ViewTrigger
                    class="hover:preset-tonal rounded-base text-surface-950-50 inline-flex h-8 flex-1 items-center justify-center border-0 bg-transparent px-3 text-sm font-medium shadow-none"
                  >
                    <DatePicker.RangeText />
                  </DatePicker.ViewTrigger>
                  <DatePicker.NextTrigger
                    class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
                  />
                </DatePicker.ViewControl>
                <DatePicker.Table class="w-full border-collapse">
                  <DatePicker.TableBody>
                    {#each datePicker().getYearsGrid({ columns: 4 }) as years, id (id)}
                      <DatePicker.TableRow>
                        {#each years as year, id (id)}
                          <DatePicker.TableCell
                            value={year.value}
                            class="p-1 text-center align-middle"
                          >
                            <DatePicker.TableCellTrigger
                              class="hover:preset-tonal data-[selected]:preset-filled-primary-500 rounded-base inline-flex h-10 w-full items-center justify-center text-sm"
                            >
                              {year.label}
                            </DatePicker.TableCellTrigger>
                          </DatePicker.TableCell>
                        {/each}
                      </DatePicker.TableRow>
                    {/each}
                  </DatePicker.TableBody>
                </DatePicker.Table>
              {/snippet}
            </DatePicker.Context>
          </DatePicker.View>

          {#if showActions}
            <div class="flex justify-center gap-2">
              <button
                type="button"
                class="btn btn-sm preset-tonal"
                onclick={() => {
                  selectedDate = [...pickerValue];
                  showMenu = false;
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                class="btn btn-sm preset-filled"
                onclick={() => {
                  handlePickerChange(selectedDate[0]?.toString() ?? null);
                  showMenu = false;
                }}
                disabled={selectedDate.length === 0}
              >
                {okLabel}
              </button>
            </div>
          {/if}
        </DatePicker.Content>
      </DatePicker.Positioner>
    </Portal>
  </DatePicker>
</ControlWrapper>
