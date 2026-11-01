<script lang="ts">
  import {
    useJsonForms,
    registerDetailDialogChange,
    useAuthoredConfig,
    warnTemporalSaveFormat,
    useTemporalDataBounds,
    temporalRestrict,
    temporalTimeColumns,
    timeValueWithinOffsetBounds,
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
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Clock3Icon, XIcon } from '$lib/components/icons';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
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
  import TimePicker from '../components/TimePicker.svelte';

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
  let rejectedRange = $state(false);
  $effect(() => {
    if ((binding.control.readonly || !binding.control.enabled) && showMenu) showMenu = false;
    if (!showMenu) rejectedRange = false;
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
  const useSeconds = $derived(
    timeFormat.includes('s') || temporalTimeColumns(binding.appliedOptions.views)?.seconds === true,
  );

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
      true,
    ),
  );

  const minTime = $derived.by(() => {
    if (offsetBounded) return undefined;
    return schemaBounds.min?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const maxTime = $derived.by(() => {
    if (offsetBounded) return undefined;
    return schemaBounds.max?.format(useSeconds ? 'HH:mm:ss' : 'HH:mm');
  });

  const offsetBounded = $derived(
    restrict && timeValueWithinOffsetBounds('00:00:00Z', boundsSchema) !== undefined,
  );

  const inputValue = $derived.by(() => {
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const time = parseTemporalText(value, formats);
    return time ? time.format(timeFormat) : (value ?? '');
  });

  // The picker and displayed input must use the same local clock for stored
  // offset-bearing times. Bounds are parsed in that clock as well.
  const pickerValue = $derived.by(() => {
    const value = binding.control.data;
    const parsed = parseTemporalText(value, formats);
    return parsed?.format('HH:mm:ss') ?? value;
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
  const pickerRangeError = $derived(
    showMenu && rejectedRange ? message('time.outOfRange') : undefined,
  );

  function pickerTimeAllowed(value: string | undefined): boolean {
    if (!value || (!offsetBounded && schemaBounds.empty)) return false;
    const time = parseDateTime(value, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    if (!time) return false;
    if (offsetBounded) {
      return timeValueWithinOffsetBounds(time.format(timeSaveFormat), boundsSchema) ?? false;
    }
    return temporalValueWithinBounds(time, schemaBounds, true);
  }

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
      placeholder: binding.appliedOptions.placeholder ?? timeFormat,
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

    const time = parseTemporalText(value, timeFormat);

    if (value && !time && (!useMask || !maskState.completed)) {
      textDraft = value;
      return;
    }
    textDraft = undefined;

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
    if (!pickerTimeAllowed(value ?? undefined)) return;
    const time = parseDateTime(value, useSeconds ? 'HH:mm:ss' : 'HH:mm');
    const nextValue = time ? time.format(timeSaveFormat) : value;

    if (adaptValue(nextValue) !== binding.control.data) {
      binding.onChange(nextValue);
    }
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover.Root {...binding.shadcnProps('Popover')} bind:open={showMenu}>
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
        disabled={!binding.control.enabled || binding.control.readonly}
        aria-label={message('temporal.chooseTime')}
      >
        <Clock3Icon class="h-4 w-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled || binding.control.readonly}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="h-4 w-4" />
        </Button>
      {/if}
    </div>

    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="max-h-[min(30rem,var(--bits-popover-content-available-height,30rem),calc(100dvh-2rem))] w-auto overflow-y-auto p-4"
    >
      {#key showMenu}
        <TimePicker
          views={binding.appliedOptions.views}
          disabled={!binding.control.enabled ||
            binding.control.readonly ||
            (!offsetBounded && schemaBounds.empty)}
          value={pickerValue}
          min={minTime}
          max={maxTime}
          isAllowed={pickerTimeAllowed}
          {useSeconds}
          {ampm}
          onchange={(value) => {
            rejectedRange = false;
            if (!showActions) handlePickerChange(value);
          }}
          onrejected={() => (rejectedRange = true)}
        >
          {#snippet actionSlot({ selectedTime })}
            {#if showActions}
              <div class="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    showMenu = false;
                  }}
                >
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  onclick={() => {
                    if (selectedTime && pickerTimeAllowed(selectedTime) && !rejectedRange) {
                      handlePickerChange(selectedTime);
                      showMenu = false;
                    }
                  }}
                  disabled={!pickerTimeAllowed(selectedTime) || rejectedRange}
                >
                  {okLabel}
                </Button>
              </div>
            {/if}
          {/snippet}
        </TimePicker>
      {/key}
      {#if pickerRangeError}
        <p id={`${binding.control.id}-draft-range`} role="alert" class="text-destructive text-xs">
          {pickerRangeError}
        </p>
      {/if}
    </Popover.Content>
  </Popover.Root>
  {#if textDraft !== undefined}
    <p id={`${binding.control.id}-draft-hint`} role="note" class="text-muted-foreground text-xs">
      {message('temporal.completeTime', { format: timeFormat })}
    </p>
  {/if}
</ControlWrapper>
