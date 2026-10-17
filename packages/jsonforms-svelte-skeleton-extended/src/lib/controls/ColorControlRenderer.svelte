<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useTranslator,
    useJsonForms,
  } from '@chobantonov/jsonforms-svelte';
  import {
    isTransparentColor,
    toColorInputValue,
    parseColor,
    serializeColor,
    resolveColorOptions,
    colorMessage,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    determineClearValue,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { XIcon } from '@lucide/svelte';
  import { onDestroy, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);

  const form = useJsonForms();
  const t = useTranslator();
  const profile = $derived(
    resolveColorOptions(binding.control.config, binding.control.uischema.options),
  );
  const hex3 = $derived(profile.saveFormat === 'hex3');
  const message = (key: Parameters<typeof colorMessage>[1]) => {
    const translationKey =
      key === 'choose'
        ? 'editor.chooseColor'
        : key === 'clear'
          ? 'control.clearValue'
          : `color.${key}`;
    return (
      t.value(translationKey, colorMessage(form.i18n?.locale, key)) ??
      colorMessage(form.i18n?.locale, key)
    );
  };
  let draftText = $state<string | undefined>();
  const inputValue = $derived(
    draftText ??
      (typeof binding.control.data === 'string'
        ? binding.control.data
        : binding.control.data === undefined
          ? ''
          : JSON.stringify(binding.control.data)),
  );
  const transparentHex3 = $derived(hex3 && isTransparentColor(inputValue));
  const invalidText = $derived(inputValue !== '' && !parseColor(inputValue));
  const pickerValue = $derived(toColorInputValue(binding.control.data));
  const placeholder = $derived(
    t.value(
      `color.placeholder.${profile.saveFormat}`,
      {
        hex: '#RRGGBB',
        hex3: '#RGB',
        rgb: 'rgb(0, 128, 255)',
        hsb: 'hsb(210, 100%, 100%)',
      }[profile.saveFormat],
    ),
  );
  let pickerCommitTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingPickerValue: string | undefined;

  function cancelPickerCommit() {
    if (pickerCommitTimer !== undefined) clearTimeout(pickerCommitTimer);
    pickerCommitTimer = undefined;
    pendingPickerValue = undefined;
  }

  const settings = () =>
    JSON.stringify([
      binding.control.path,
      binding.control.enabled,
      profile.saveFormat,
      profile.textEntry,
    ]);
  let lastSettings = untrack(settings);
  let lastExternal = untrack(() => JSON.stringify(binding.control.data));
  let lastCommitted: string | undefined;
  $effect(() => {
    const nextSettings = settings();
    const nextExternal = JSON.stringify(binding.control.data);
    if (
      nextSettings !== lastSettings ||
      (nextExternal !== lastExternal && binding.control.data !== lastCommitted)
    ) {
      draftText = undefined;
      lastCommitted = undefined;
    }
    if (nextSettings !== lastSettings || nextExternal !== lastExternal) cancelPickerCommit();
    lastSettings = nextSettings;
    lastExternal = nextExternal;
  });

  function commitPickerValue() {
    const value = pendingPickerValue;
    cancelPickerCommit();
    if (!binding.control.enabled || transparentHex3 || value === undefined) return;
    draftText = undefined;
    if (value !== inputValue) binding.onChange(value);
  }

  function schedulePickerCommit(event: Event) {
    if (!binding.control.enabled || transparentHex3) return;
    const picker = event.currentTarget as HTMLInputElement;
    const parsed = parseColor(picker.value);
    if (!parsed) return;
    // The platform picker edits RGB only; retain existing alpha explicitly.
    parsed.a = parseColor(binding.control.data)?.a ?? 1;
    pendingPickerValue = serializeColor(parsed, profile.saveFormat);
    if (hex3 && pendingPickerValue) picker.value = toColorInputValue(pendingPickerValue);
    if (pickerCommitTimer !== undefined) clearTimeout(pickerCommitTimer);
    pickerCommitTimer = setTimeout(commitPickerValue, 150);
  }

  function handlePickerBlur() {
    commitPickerValue();
    binding.handleBlur();
  }

  function handleTextInput(event: Event) {
    if (!binding.control.enabled) return;
    cancelPickerCommit();
    const input = event.currentTarget as HTMLInputElement;
    if (input.value === '') {
      draftText = undefined;
      binding.onChange(clearValue);
      return;
    }
    const parsed = parseColor(input.value);
    const saved = parsed && serializeColor(parsed, profile.saveFormat);
    if (saved === undefined) {
      draftText = input.value;
      return;
    }
    // A valid three-digit prefix must not expand under the user's caret
    // while they are still typing a six- or eight-digit color.
    draftText = input.value;
    lastCommitted = saved;
    binding.onChange(saved);
  }

  function handleTextBlur() {
    binding.handleBlur();
    if (parseColor(inputValue) && !transparentHex3) draftText = undefined;
  }

  function clearColor() {
    if (!binding.control.enabled) return;
    cancelPickerCommit();
    draftText = undefined;
    binding.onChange(clearValue);
  }

  onDestroy(cancelPickerCommit);

  const textInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        'input w-full',
        binding.styles.control.input,
        skeletonProps.class,
        'ps-12',
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? placeholder,
      value: inputValue,
      oninput: handleTextInput,
      onfocus: binding.handleFocus,
      onblur: handleTextBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || invalidText || transparentHex3,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class={profile.textEntry ? 'group relative w-full' : 'group relative h-9 w-24'}>
    {#if profile.textEntry}<input {...textInputProps} />{/if}

    <div
      class="h-7 w-9"
      style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      data-color-picker-wrapper
    >
      <input
        id={`${binding.control.id}-${profile.textEntry ? 'picker' : 'input'}`}
        type="color"
        aria-required={binding.control.required || undefined}
        aria-invalid={!!binding.control.errors || invalidText || transparentHex3}
        value={pickerValue}
        disabled={!binding.control.enabled || transparentHex3}
        aria-label={profile.textEntry
          ? message(inputValue === '' ? 'chooseEmpty' : 'choose')
          : binding.control.label || message('choose')}
        title={message(inputValue === '' ? 'chooseEmpty' : 'choose')}
        oninput={schedulePickerCommit}
        onchange={schedulePickerCommit}
        onfocus={binding.handleFocus}
        onblur={handlePickerBlur}
        class="border-surface-400-600 rounded-base h-full w-full cursor-pointer border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {#if !parseColor(binding.control.data)}
        <span
          class="color-empty-swatch border-surface-400-600 rounded-base pointer-events-none absolute inset-0 border"
          data-color-empty-swatch
          aria-hidden="true"
        >
          <svg
            class="block h-full w-full"
            viewBox="0 0 32 24"
            preserveAspectRatio="none"
            shape-rendering="crispEdges"
            data-color-empty-pattern
          >
            <rect class="color-empty-base" width="32" height="24" />
            <path
              class="color-empty-check"
              d="M0 0h8v8H0zM16 0h8v8h-8zM8 8h8v8H8zM24 8h8v8h-8zM0 16h8v8H0zM16 16h8v8h-8z"
            />
          </svg>
        </span>
      {/if}
    </div>

    {#if textInputProps.value !== '' && binding.clearable}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={clearColor}
        aria-label={message('clear')}
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
  {#if transparentHex3 || invalidText}
    <p role="alert">
      {message(transparentHex3 ? 'hex3Transparency' : 'invalid')}{#if !profile.textEntry}
        {inputValue}{/if}
    </p>
  {/if}
</ControlWrapper>

<style>
  .color-empty-swatch {
    pointer-events: none;
  }

  .color-empty-base {
    fill: var(--color-surface-50-950, light-dark(#ffffff, #111827));
  }

  .color-empty-check {
    fill: var(--color-surface-400-600, light-dark(#94a3b8, #64748b));
    opacity: 0.58;
  }

  input[type='color']:focus-visible + .color-empty-swatch {
    outline: 2px solid var(--color-primary-500, #6366f1);
    outline-offset: 2px;
  }
</style>
