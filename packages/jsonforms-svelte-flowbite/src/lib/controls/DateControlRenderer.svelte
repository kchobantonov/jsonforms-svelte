<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  import {
    useJsonFormsControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Button,
    CloseButton,
    Datepicker,
    Input,
    Popover,
    ToolbarButton,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { CalendarMonthOutline } from 'flowbite-svelte-icons';
  import { type MaskaDetail, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    convertDayjsToMaskaFormat,
    determineClearValue,
    expandLocaleFormat,
    parseDateTime,
    useFlowbiteControl,
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
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const adaptValue = (value: any) => value || clearValue;
  const input = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  const t = useTranslator();

  const dateFormat = $derived.by(() => {
    const format = input.appliedOptions.dateFormat;
    return typeof format === 'string'
      ? (expandLocaleFormat(format) ?? format)
      : (expandLocaleFormat('L') ?? 'YYYY-MM-DD');
  });

  const dateSaveFormat = $derived.by(() => {
    return typeof input.appliedOptions.dateSaveFormat === 'string'
      ? input.appliedOptions.dateSaveFormat
      : 'YYYY-MM-DD';
  });

  const formats = $derived([dateSaveFormat, dateFormat, ...JSON_SCHEMA_DATE_FORMATS]);

  const useMask = $derived(input.appliedOptions.mask !== false);

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
    const flowbiteProps = input.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableFrom === 'string') {
      return flowbiteProps.availableFrom;
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
    const flowbiteProps = input.flowbiteProps('Datepicker');
    if (typeof flowbiteProps.availableTo === 'string') {
      return flowbiteProps.availableTo;
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
    const value = input.control.data;
    const date = parseDateTime(value, formats);
    return date ? date.format(dateFormat) : value;
  });

  const pickerValue = $derived.by(() => {
    const value = input.control.data;
    const date = parseDateTime(value, formats);
    return date ? date.toDate() : undefined;
  });

  const cancelLabel = $derived.by(() => {
    const label =
      typeof input.appliedOptions.cancelLabel == 'string'
        ? input.appliedOptions.cancelLabel
        : 'Cancel';

    return t.value(label, label);
  });

  const okLabel = $derived.by(() => {
    const label =
      typeof input.appliedOptions.okLabel == 'string'
        ? input.appliedOptions.okLabel
        : 'OK';

    return t.value(label, label);
  });

  const showActions = $derived.by(() => {
    return input.appliedOptions.showActions === true;
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

    const date = parseDateTime(value, dateFormat);

    if (date) {
      value = date.format(dateSaveFormat);
    }

    if (adaptValue(value) !== input.control.data) {
      input.onChange(value);
    }
  }

  function handlePickerChange(val: Date | undefined) {
    const date = parseDateTime(val, undefined);
    const newdata = date ? date.format(dateSaveFormat) : null;
    input.onChange(newdata);
  }

  const inputProps = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Input');

    return {
      clearableColor: 'none' as CloseButtonProps['color'],

      ...flowbiteProps,
      type: 'text',
      id: `${input.control.id}-input`,
      class: twMerge(
        input.clearable ? 'pr-9' : '',
        input.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !input.control.enabled,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder ?? dateFormat,
      value: inputValue,
      clearable: input.clearable,
      oninput: (e: Event) => handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => {
        handleInputChange(null);
      },
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
    };
  });

  const instanceId = counter++;
  const menuId = $derived(`${input.control.id}-menu-${instanceId}`);
</script>

<ControlWrapper {...input.controlWrapper}>
  <div class="relative">
    <Input {...inputProps}>
      {#snippet left()}
        <ToolbarButton
          id={menuId}
          size="sm"
          background={false}
          class="pointer-events-auto"
          onclick={() => (showMenu = !showMenu)}
          disabled={!input.control.enabled}
        >
          <CalendarMonthOutline class="h-4 w-4" />
        </ToolbarButton>
      {/snippet}
      {#snippet children(props)}
        <input
          {...props}
          class={twMerge(props.class, 'pl-9')}
          value={inputProps.value}
          oninput={inputProps.oninput}
          onfocus={inputProps.onfocus}
          onblur={inputProps.onblur}
          use:maska={maskOptions}
        />
      {/snippet}
      {#snippet right()}
        {#if inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable}
          <CloseButton
            class="pointer-events-auto"
            disabled={!input.control.enabled}
            color={inputProps.clearableColor}
            aria-label="Clear search value"
          />
        {/if}
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
        {...input.flowbiteProps('Datepicker')}
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
                disabled={!selectedDate}>{okLabel}</Button
              >
            </div>
          {/if}
        {/snippet}
      </Datepicker>
    </Popover>
  </div>
</ControlWrapper>
