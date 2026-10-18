<script lang="ts">
  import ColorPicker from './components/ColorPicker.svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useTranslator,
    useJsonForms,
  } from '@chobantonov/jsonforms-svelte';
  import {
    isTransparentColor,
    parseColor,
    serializeColor,
    resolveColorOptions,
    colorMessage,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import { CloseButton, Input, type CloseButtonProps } from 'flowbite-svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);

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
  const settings = () =>
    JSON.stringify([
      binding.control.path,
      binding.control.enabled,
      binding.control.readonly,
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
    lastSettings = nextSettings;
    lastExternal = nextExternal;
  });

  function handleTextInput(event: Event) {
    if (!binding.control.enabled || binding.control.readonly) return;
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
    if (!binding.control.enabled || binding.control.readonly) return;
    draftText = undefined;
    binding.onChange(clearValue);
  }

  const textInputProps = $derived.by(() => {
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
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? placeholder,
      value: inputValue,
      clearable: binding.clearable,
      oninput: handleTextInput,
      onfocus: binding.handleFocus,
      onblur: handleTextBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || invalidText || transparentHex3,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    class={profile.textEntry
      ? 'color-control-group relative w-full'
      : 'color-control-group relative w-24'}
  >
    <Input {...textInputProps}>
      {#snippet left()}
        <div class="relative h-7 w-9" data-color-picker-wrapper>
          <ColorPicker
            id={`${binding.control.id}-${profile.textEntry ? 'picker' : 'input'}`}
            value={binding.control.data}
            format={profile.saveFormat}
            disabled={!binding.control.enabled || binding.control.readonly === true}
            clearable={binding.clearable}
            required={binding.control.required}
            invalid={!!binding.control.errors || invalidText || transparentHex3}
            label={profile.textEntry
              ? message(inputValue === '' ? 'chooseEmpty' : 'choose')
              : binding.control.label || message('choose')}
            title={message(inputValue === '' ? 'chooseEmpty' : 'choose')}
            onchange={(value) => {
              draftText = undefined;
              binding.onChange(value);
            }}
            onclear={clearColor}
          />
        </div>
      {/snippet}
      {#snippet children(inputProps)}
        {#if profile.textEntry}
          <input
            {...inputProps}
            style={`${inputProps.style ?? ''}; padding-inline-start: 3rem;`}
            value={textInputProps.value}
            oninput={textInputProps.oninput}
            onfocus={textInputProps.onfocus}
            onblur={textInputProps.onblur}
          />
        {:else}<div class="h-9 min-w-0"></div>{/if}
      {/snippet}
      {#snippet right()}
        {#if textInputProps.value !== '' && textInputProps.clearable}
          <CloseButton
            class="color-clear-button pointer-events-auto"
            disabled={!binding.control.enabled}
            color={textInputProps.clearableColor}
            ariaLabel={message('clear')}
            onmousedown={(event: MouseEvent) => event.preventDefault()}
            onclick={clearColor}
          />
        {/if}
      {/snippet}
    </Input>
  </div>
  {#if transparentHex3 || invalidText}
    <p role="alert">
      {message(transparentHex3 ? 'hex3Transparency' : 'invalid')}{#if !profile.textEntry}
        {inputValue}{/if}
    </p>
  {/if}
</ControlWrapper>

<style>
  .color-control-group :global(.color-clear-button) {
    visibility: hidden;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .color-control-group:hover :global(.color-clear-button),
  .color-control-group:focus-within :global(.color-clear-button),
  .color-control-group :global(.color-clear-button:focus-visible) {
    visibility: visible;
    opacity: 1;
  }
</style>
