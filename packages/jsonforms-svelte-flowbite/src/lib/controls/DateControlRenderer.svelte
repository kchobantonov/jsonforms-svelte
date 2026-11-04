<script lang="ts">
  import Datepicker from './components/LocalizedDatepicker.svelte';
  import {
    useJsonForms,
    registerDetailDialogChange,
    useAuthoredConfig,
    temporalDateMode,
    warnTemporalSaveFormat,
    useUIDiagnosticReporter,
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
  import clsx from 'clsx';
  import {
    Button,
    CloseButton,
    getTheme,
    Input,
    input as inputTheme,
    Popover,
    Select,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { CalendarMonthOutline } from 'flowbite-svelte-icons';
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
    temporalValueWithinBounds,
    useFlowbiteControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const JSON_SCHEMA_DATE_FORMATS = ['YYYY-MM-DD'];

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
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
  });
  let popoverReady = $state(false);
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  onMount(() => {
    let active = true;
    void tick().then(() => {
      if (active) popoverReady = true;
    });
    return () => {
      active = false;
    };
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

  const reportedSaveFormats = new Set<string>();
  const reportDiagnostic = useUIDiagnosticReporter();
  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      dateSaveFormat,
      formatTemporalProbe(dateSaveFormat),
      binding.control.path,
      reportedSaveFormats,
      reportDiagnostic,
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

  const inputValue = $derived.by(() => {
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const date = parseTemporalText(value, formats);
    return date ? date.format(dateFormat) : value;
  });

  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const date = parseDateTime(value, formats);
    return date ? date.toDate() : undefined;
  });

  const cancelLabel = $derived.by(() => {
    const label = binding.appliedOptions.cancelLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.cancel');
  });

  const okLabel = $derived.by(() => {
    const label = binding.appliedOptions.okLabel;
    return typeof label === 'string' ? t.value(label, label) : message('temporal.ok');
  });

  const dateMode = $derived(temporalDateMode(binding.appliedOptions.views, dateFormat));
  let coarseDate = $state<Date>();
  const storedDate = $derived(binding.control.data);
  $effect(() => {
    const value = storedDate;
    if (showMenu) coarseDate = untrack(() => parseDateTime(value, formats)?.toDate() ?? new Date());
  });
  const coarseYear = $derived(coarseDate?.getFullYear() ?? new Date().getFullYear());
  const coarseMonth = $derived(coarseDate?.getMonth() ?? 0);
  const selectableYears = $derived.by(() => {
    const first = schemaBounds.min?.year() ?? new Date().getFullYear() - 100;
    const last = schemaBounds.max?.year() ?? new Date().getFullYear() + 100;
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
  });
  const selectableMonths = $derived(
    Array.from({ length: 12 }, (_, index) => ({
      value: index,
      label: new Intl.DateTimeFormat(temporalForm.i18n?.locale, { month: 'long' }).format(
        new Date(2000, index, 1),
      ),
    })),
  );
  function updateCoarseDate(part: 'year' | 'month', value: number) {
    const year = part === 'year' ? value : coarseYear;
    const month = part === 'month' ? value : coarseMonth;
    const day = Math.min(coarseDate?.getDate() ?? 1, new Date(year, month + 1, 0).getDate());
    coarseDate = new Date(year, month, day);
    if (!showActions) handlePickerChange(coarseDate);
  }
  const coarseAllowed = $derived.by(() => {
    const date = parseDateTime(coarseDate, undefined);
    return !!date && temporalValueWithinBounds(date, schemaBounds);
  });
  const coarseRangeError = $derived(
    showMenu && dateMode !== 'date' && coarseDate && restrict && !coarseAllowed
      ? message('date.outOfRange')
      : undefined,
  );

  const showActions = $derived.by(() => {
    return binding.appliedOptions.showActions === true;
  });

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

    const date = parseTemporalText(value, dateFormat);

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

  function handlePickerChange(val: Date | undefined) {
    if (schemaBounds.empty) return;
    const date = parseDateTime(val, undefined);
    if (date && !temporalValueWithinBounds(date, schemaBounds, false)) return;
    const newdata = date ? date.format(dateSaveFormat) : null;
    binding.onChange(newdata);
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
      placeholder: binding.appliedOptions.placeholder ?? dateFormat,
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
          coarseRangeError ? `${binding.control.id}-draft-range` : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    };
  });

  const componentId = $props.id();
  const menuId = `${componentId}-menu`;

  function restoreFocusOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    const root = event.currentTarget instanceof Element ? event.currentTarget.getRootNode() : null;
    queueMicrotask(() => {
      if (root instanceof Document || root instanceof ShadowRoot)
        root.getElementById(menuId)?.focus();
    });
  }

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
          aria-label={message('temporal.openDate')}
          aria-haspopup="dialog"
          aria-expanded={showMenu}
          disabled={!binding.control.enabled || binding.control.readonly}
          tabindex={-1}
        >
          <CalendarMonthOutline class="h-4 w-4" />
        </button>
        {#if popoverReady}
          <Popover
            onkeydowncapture={restoreFocusOnEscape}
            arrow={false}
            class="pointer-events-auto max-h-[min(30rem,calc(50dvh-2rem))] w-auto overflow-y-auto"
            placement="bottom-start"
            bind:isOpen={showMenu}
            trigger="click"
          >
            {#if dateMode !== 'date'}
              <div class="grid min-w-64 grid-cols-2 gap-2 p-2">
                {#if dateMode === 'month'}
                  <Select
                    placeholder=""
                    value={String(coarseMonth)}
                    aria-label={message('temporal.month')}
                    disabled={!binding.control.enabled || binding.control.readonly}
                    onchange={(event) =>
                      updateCoarseDate('month', Number(event.currentTarget.value))}
                  >
                    {#each selectableMonths as month (month.value)}<option
                        value={String(month.value)}>{month.label}</option
                      >{/each}
                  </Select>
                {/if}
                <Select
                  placeholder=""
                  value={String(coarseYear)}
                  aria-label={message('temporal.year')}
                  disabled={!binding.control.enabled || binding.control.readonly}
                  onchange={(event) => updateCoarseDate('year', Number(event.currentTarget.value))}
                >
                  {#each selectableYears as year (year)}<option value={String(year)}>{year}</option
                    >{/each}
                </Select>
              </div>
              {#if coarseRangeError}
                <p
                  id={`${binding.control.id}-draft-range`}
                  role="alert"
                  class="text-xs text-red-600 dark:text-red-400"
                >
                  {coarseRangeError}
                </p>
              {/if}
              {#if showActions}<div class="mt-2 flex justify-end gap-2">
                  <Button color="alternative" size="sm" onclick={() => (showMenu = false)}
                    >{cancelLabel}</Button
                  >
                  <Button
                    size="sm"
                    disabled={!binding.control.enabled || !coarseAllowed}
                    onclick={() => {
                      if (!coarseAllowed) return;
                      handlePickerChange(coarseDate);
                      showMenu = false;
                    }}>{okLabel}</Button
                  >
                </div>{/if}
            {:else}
              <Datepicker
                locale={temporalForm.i18n?.locale}
                {...binding.flowbiteProps('Datepicker')}
                value={pickerValue}
                inline
                availableFrom={parseDateTime(minDate, formats)?.toDate()}
                availableTo={parseDateTime(maxDate, formats)?.toDate()}
                onselect={(value) => {
                  if (!showActions) {
                    handlePickerChange(value as Date);
                    showMenu = false;
                  }
                }}
                onapply={(value) => handlePickerChange(value as Date)}
              >
                {#snippet actionSlot({ selectedDate, handleApply, close })}
                  {#if showActions}
                    <div class="mt-2 flex justify-center gap-2">
                      <Button
                        color="alternative"
                        size="sm"
                        onclick={() => {
                          showMenu = false;
                          close();
                        }}>{cancelLabel}</Button
                      >
                      <Button
                        size="sm"
                        color="primary"
                        onclick={() => {
                          if (selectedDate) {
                            handleApply(selectedDate);
                          }
                          showMenu = false;
                        }}
                        disabled={!selectedDate || schemaBounds.empty}>{okLabel}</Button
                      >
                    </div>
                  {/if}
                {/snippet}
              </Datepicker>
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
      {message('temporal.completeDate', { format: dateFormat })}
    </p>
  {/if}
</ControlWrapper>
