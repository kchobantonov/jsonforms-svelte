<script lang="ts">
  import {
    useJsonFormsControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    getPortalTarget,
    parseDateTime,
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
  let maskState = $state<MaskaDetail>({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);
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
      placeholder: binding.appliedOptions.placeholder ?? timeFormat,
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

    const time = parseDateTime(value, timeFormat);

    if (time) {
      value = time.format(timeSaveFormat);
    }

    if (adaptValue(value) !== binding.control.data) {
      binding.onChange(value);
    }
  }

  function handlePickerChange(value: string | null) {
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
        disabled={!binding.control.enabled}
        aria-label={t.value('Choose time', 'Choose time')}
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
          disabled={!binding.control.enabled}
          aria-label={t.value('Clear value', 'Clear value')}
        >
          <XIcon class="h-4 w-4" />
        </Button>
      {/if}
    </div>

    <Popover.Content portalProps={{ to: getPortalTarget() }} align="start" class="w-auto p-4">
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
                  if (selectedTime) {
                    handlePickerChange(selectedTime);
                  }
                  showMenu = false;
                }}
                disabled={!selectedTime}
              >
                {okLabel}
              </Button>
            </div>
          {/if}
        {/snippet}
      </TimePicker>
    </Popover.Content>
  </Popover.Root>
</ControlWrapper>
