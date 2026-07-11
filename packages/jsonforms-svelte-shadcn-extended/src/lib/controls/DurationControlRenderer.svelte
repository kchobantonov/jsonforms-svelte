<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useTranslator,
  } from '@chobantonov/jsonforms-svelte';
  import {
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    useShadcnControl,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { Button, Input, Label, Popover } from '@chobantonov/jsonforms-svelte-shadcn';
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
  const binding = useShadcnControl(useJsonFormsControl(props), (value) => value || clearValue);
  const t = useTranslator();
  let showMenu = $state(false);
  let draft = $state<DurationParts>({ ...EMPTY_DURATION_PARTS });

  $effect(() => {
    if (!showMenu) return;

    untrack(() => {
      draft = parseDuration(binding.control.data) ?? { ...EMPTY_DURATION_PARTS };
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
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
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
        aria-label="Choose duration"
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>

    <Popover.Content portalProps={{ to: getPortalTarget() }} align="start" class="w-[22rem] p-4">
      <div class="space-y-3">
        <div class="grid grid-cols-1 gap-3">
          {#each fieldConfigs.slice(0, 1) as field (field.key)}
            <Label class="block space-y-1.5">
              <span class="text-xs font-medium">{field.label}</span>
              <div class="group/field relative">
                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  disabled={isFieldDisabled(field.key)}
                  class="pe-9"
                  value={String(draft[field.key])}
                  onkeydown={preventInvalidNumberInput}
                  oninput={(e: Event) =>
                    updateField(field.key, (e.target as HTMLInputElement).value)}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-hover/field:opacity-100"
                  disabled={isFieldDisabled(field.key)}
                  onclick={() => clearField(field.key)}
                  aria-label={`Clear ${field.label}`}
                >
                  <XIcon class="size-4" />
                </Button>
              </div>
            </Label>
          {/each}
        </div>

        <div class="grid grid-cols-3 gap-3">
          {#each fieldConfigs.slice(1, 4) as field (field.key)}
            <Label class="block space-y-1.5">
              <span class="text-xs font-medium">{field.label}</span>
              <div class="group/field relative">
                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  disabled={isFieldDisabled(field.key)}
                  class="pe-9"
                  value={String(draft[field.key])}
                  onkeydown={preventInvalidNumberInput}
                  oninput={(e: Event) =>
                    updateField(field.key, (e.target as HTMLInputElement).value)}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-hover/field:opacity-100"
                  disabled={isFieldDisabled(field.key)}
                  onclick={() => clearField(field.key)}
                  aria-label={`Clear ${field.label}`}
                >
                  <XIcon class="size-4" />
                </Button>
              </div>
            </Label>
          {/each}
        </div>

        <div class="grid grid-cols-3 gap-3">
          {#each fieldConfigs.slice(4) as field (field.key)}
            <Label class="block space-y-1.5">
              <span class="text-xs font-medium">{field.label}</span>
              <div class="group/field relative">
                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  disabled={isFieldDisabled(field.key)}
                  class="pe-9"
                  value={String(draft[field.key])}
                  onkeydown={preventInvalidNumberInput}
                  oninput={(e: Event) =>
                    updateField(field.key, (e.target as HTMLInputElement).value)}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-hover/field:opacity-100"
                  disabled={isFieldDisabled(field.key)}
                  onclick={() => clearField(field.key)}
                  aria-label={`Clear ${field.label}`}
                >
                  <XIcon class="size-4" />
                </Button>
              </div>
            </Label>
          {/each}
        </div>

        {#if weeksDisabled}
          <p class="text-muted-foreground text-xs">
            Clear the other duration fields to enable weeks.
          </p>
        {:else if otherFieldsDisabled}
          <p class="text-muted-foreground text-xs">
            Clear weeks to enable years, months, days, hours, minutes, and seconds.
          </p>
        {/if}
      </div>

      {#if showActions}
        <div class="border-border mt-4 flex justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              cancel();
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              confirm();
            }}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
</ControlWrapper>
