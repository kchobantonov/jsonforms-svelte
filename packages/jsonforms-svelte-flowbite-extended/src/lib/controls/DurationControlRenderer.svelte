<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  import { type ControlProps, useJsonFormsControl, useTranslator } from '@chobantonov/jsonforms-svelte';
  import clsx from 'clsx';
  import {
    Button,
    CloseButton,
    getTheme,
    Input,
    input as inputTheme,
    Popover,
    ToolbarButton,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { ClockOutline } from 'flowbite-svelte-icons';
  import { type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { ControlWrapper, determineClearValue, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    EMPTY_DURATION_PARTS,
    formatDurationIso,
    getDurationMaskOptions,
    parseDuration,
    sanitizeDurationParts,
    type DurationParts,
  } from './duration';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);
  const t = useTranslator();

  let showMenu = $state(false);
  let draft = $state<DurationParts>({ ...EMPTY_DURATION_PARTS });

  $effect(() => {
    showMenu;

    untrack(() => {
      if (showMenu) {
        draft = parseDuration(binding.control.data) ?? { ...EMPTY_DURATION_PARTS };
      }
    });
  });

  const maskOptions = $derived.by<MaskInputOptions>(() => {
    const state = getDurationMaskOptions();

    return {
      mask: state.mask,
      tokens: state.tokens,
      tokensReplace: true,
    };
  });

  const inputValue = $derived.by(() => {
    return typeof binding.control.data === 'string' ? binding.control.data : '';
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

  const fieldConfigs: Array<{
    key: keyof DurationParts;
    label: string;
    min: number;
    max?: number;
  }> = [
    { key: 'weeks', label: 'Weeks', min: 0 },
    { key: 'years', label: 'Years', min: 0 },
    { key: 'months', label: 'Months', min: 0, max: 11 },
    { key: 'days', label: 'Days', min: 0 },
    { key: 'hours', label: 'Hours', min: 0, max: 23 },
    { key: 'minutes', label: 'Minutes', min: 0, max: 59 },
    { key: 'seconds', label: 'Seconds', min: 0, max: 59 },
  ];

  const showActions = $derived(binding.appliedOptions.showActions !== false);
  const weeksDisabled = $derived(
    draft.years > 0 ||
      draft.months > 0 ||
      draft.days > 0 ||
      draft.hours > 0 ||
      draft.minutes > 0 ||
      draft.seconds > 0,
  );
  const otherFieldsDisabled = $derived(draft.weeks > 0);

  function applyDuration(parts: DurationParts | null) {
    if (parts === null) {
      binding.onChange(clearValue);
      return;
    }

    binding.onChange(formatDurationIso(sanitizeDurationParts(parts)));
  }

  function handleInputChange(value: string | null) {
    if (value === null || value === '') {
      applyDuration(null);
      return;
    }

    const parsed = parseDuration(value);
    if (parsed) {
      applyDuration(parsed);
    }
  }

  function updateField(key: keyof DurationParts, value: string) {
    const parsed = Number.parseInt(value, 10);
    const nextDraft: DurationParts = {
      ...draft,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
    };
    if (key === 'weeks' && nextDraft.weeks > 0) {
      nextDraft.years = 0;
      nextDraft.months = 0;
      nextDraft.days = 0;
      nextDraft.hours = 0;
      nextDraft.minutes = 0;
      nextDraft.seconds = 0;
    }

    if (key !== 'weeks' && nextDraft[key] > 0) {
      nextDraft.weeks = 0;
    }

    draft = sanitizeDurationParts(nextDraft);

    if (!showActions) {
      applyDuration(draft);
    }
  }

  function clearField(key: keyof DurationParts) {
    updateField(key, '0');
  }

  function preventInvalidNumberInput(event: KeyboardEvent) {
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  function cancel() {
    draft = parseDuration(binding.control.data) ?? { ...EMPTY_DURATION_PARTS };
    showMenu = false;
  }

  function confirm() {
    applyDuration(draft);
    showMenu = false;
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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      clearable: binding.clearable,
      oninput: (e: Event) => handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => handleInputChange(null),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });

  const instanceId = counter++;
  const menuId = $derived(`${binding.control.id}-menu-${instanceId}`);
  const theme = $derived(getTheme('input'));
  const { close } = $derived(inputTheme());
  const clearableInputClass = 'pe-9';
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full">
    <Input {...inputProps}>
      {#snippet left()}
        <ToolbarButton
          id={menuId}
          size="sm"
          background={false}
          class="pointer-events-auto"
          onclick={() => (showMenu = !showMenu)}
          disabled={!binding.control.enabled}
          tabindex={-1}
        >
          <ClockOutline class="h-4 w-4" />
        </ToolbarButton>
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
        <CloseButton
          class={close({ class: clsx(theme?.close) })}
          disabled={!binding.control.enabled}
          color={inputProps.clearableColor}
          aria-label="Clear value"
        />
      {/snippet}
    </Input>

    <Popover
      arrow={false}
      class="w-80"
      placement="bottom-start"
      isOpen={showMenu}
      trigger="click"
    >
      <div class="space-y-3 p-1">
        <div class="grid grid-cols-1 gap-3">
          {#each fieldConfigs.slice(0, 1) as field (field.key)}
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </span>
              <Input
                type="number"
                min={field.min}
                max={field.max}
                disabled={!binding.control.enabled || weeksDisabled}
                class={clearableInputClass}
                value={String(draft[field.key])}
                clearable={binding.control.enabled && !weeksDisabled}
                clearableOnClick={() => clearField(field.key)}
                onkeydown={preventInvalidNumberInput}
                oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
              />
            </label>
          {/each}
        </div>

        <div class="grid grid-cols-3 gap-3">
          {#each fieldConfigs.slice(1, 4) as field (field.key)}
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </span>
              <Input
                type="number"
                min={field.min}
                max={field.max}
                disabled={!binding.control.enabled || otherFieldsDisabled}
                class={clearableInputClass}
                value={String(draft[field.key])}
                clearable={binding.control.enabled && !otherFieldsDisabled}
                clearableOnClick={() => clearField(field.key)}
                onkeydown={preventInvalidNumberInput}
                oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
              />
            </label>
          {/each}
        </div>

        <div class="grid grid-cols-3 gap-3">
          {#each fieldConfigs.slice(4) as field (field.key)}
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </span>
              <Input
                type="number"
                min={field.min}
                max={field.max}
                disabled={!binding.control.enabled || otherFieldsDisabled}
                class={clearableInputClass}
                value={String(draft[field.key])}
                clearable={binding.control.enabled && !otherFieldsDisabled}
                clearableOnClick={() => clearField(field.key)}
                onkeydown={preventInvalidNumberInput}
                oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
              />
            </label>
          {/each}
        </div>

        {#if weeksDisabled}
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Clear the other duration fields to enable weeks.
          </p>
        {:else if otherFieldsDisabled}
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Clear weeks to enable years, months, days, hours, minutes, and seconds.
          </p>
        {/if}
      </div>

      {#if showActions}
        <div class="mt-3 flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button
            color="alternative"
            size="sm"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              cancel();
            }}>{cancelLabel}</Button
          >
          <Button
            size="sm"
            color="primary"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              confirm();
            }}>{okLabel}</Button
          >
        </div>
      {/if}
    </Popover>
  </div>
</ControlWrapper>
