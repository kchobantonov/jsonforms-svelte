<script lang="ts">
  import { type ControlProps, useJsonFormsControl, useTranslator } from '@chobantonov/jsonforms-svelte';
  import {
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
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
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);
  const t = useTranslator();
  const portalTarget = getPortalTarget();
  const getRootNode = () => portalTarget?.getRootNode?.() ?? document;

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

  function isFieldDisabled(key: keyof DurationParts): boolean {
    if (!binding.control.enabled) {
      return true;
    }

    return key === 'weeks' ? weeksDisabled : otherFieldsDisabled;
  }

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
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    getRootNode={getRootNode}
    open={showMenu}
    onOpenChange={(details) => (showMenu = details.open)}
    positioning={{ placement: 'bottom-start' }}
  >
    <div class="group relative w-full">
      <input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        use:maska={maskOptions}
      />

      <Popover.Trigger
        class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-8 items-center justify-center"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        aria-label="Choose duration"
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

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
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content class="card preset-filled-surface-50-950 border-surface-200-800 w-[22rem] border p-4 shadow-xl">
          <div class="space-y-3">
            <div class="grid grid-cols-1 gap-3">
              {#each fieldConfigs.slice(0, 1) as field (field.key)}
                <label class="block space-y-1.5">
                  <span class="text-surface-950-50 text-xs font-medium">{field.label}</span>
                  <div class="group/field relative">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      disabled={isFieldDisabled(field.key)}
                      class="input w-full pe-9"
                      value={String(draft[field.key])}
                      onkeydown={preventInvalidNumberInput}
                      oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      type="button"
                      class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-hover/field:visible group-hover/field:opacity-100 focus-visible:visible focus-visible:opacity-100"
                      style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
                      disabled={isFieldDisabled(field.key)}
                      onclick={() => clearField(field.key)}
                      aria-label={`Clear ${field.label}`}
                    >
                      <XIcon class="size-4" />
                    </button>
                  </div>
                </label>
              {/each}
            </div>

            <div class="grid grid-cols-3 gap-3">
              {#each fieldConfigs.slice(1, 4) as field (field.key)}
                <label class="block space-y-1.5">
                  <span class="text-surface-950-50 text-xs font-medium">{field.label}</span>
                  <div class="group/field relative">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      disabled={isFieldDisabled(field.key)}
                      class="input w-full pe-9"
                      value={String(draft[field.key])}
                      onkeydown={preventInvalidNumberInput}
                      oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      type="button"
                      class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-hover/field:visible group-hover/field:opacity-100 focus-visible:visible focus-visible:opacity-100"
                      style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
                      disabled={isFieldDisabled(field.key)}
                      onclick={() => clearField(field.key)}
                      aria-label={`Clear ${field.label}`}
                    >
                      <XIcon class="size-4" />
                    </button>
                  </div>
                </label>
              {/each}
            </div>

            <div class="grid grid-cols-3 gap-3">
              {#each fieldConfigs.slice(4) as field (field.key)}
                <label class="block space-y-1.5">
                  <span class="text-surface-950-50 text-xs font-medium">{field.label}</span>
                  <div class="group/field relative">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      disabled={isFieldDisabled(field.key)}
                      class="input w-full pe-9"
                      value={String(draft[field.key])}
                      onkeydown={preventInvalidNumberInput}
                      oninput={(e: Event) => updateField(field.key, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      type="button"
                      class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-hover/field:visible group-hover/field:opacity-100 focus-visible:visible focus-visible:opacity-100"
                      style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
                      disabled={isFieldDisabled(field.key)}
                      onclick={() => clearField(field.key)}
                      aria-label={`Clear ${field.label}`}
                    >
                      <XIcon class="size-4" />
                    </button>
                  </div>
                </label>
              {/each}
            </div>

            {#if weeksDisabled}
              <p class="text-surface-600-400 text-xs">Clear the other duration fields to enable weeks.</p>
            {:else if otherFieldsDisabled}
              <p class="text-surface-600-400 text-xs">
                Clear weeks to enable years, months, days, hours, minutes, and seconds.
              </p>
            {/if}
          </div>

          {#if showActions}
            <div class="mt-4 flex justify-end gap-2 border-t border-surface-200-800 pt-3">
              <button
                type="button"
                class="btn btn-sm preset-outlined"
                onclick={(event: MouseEvent) => {
                  event.stopPropagation();
                  cancel();
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                class="btn btn-sm preset-filled-primary-500"
                onclick={(event: MouseEvent) => {
                  event.stopPropagation();
                  confirm();
                }}
              >
                {okLabel}
              </button>
            </div>
          {/if}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
</ControlWrapper>
