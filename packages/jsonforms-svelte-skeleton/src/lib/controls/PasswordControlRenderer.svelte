<script lang="ts">
  import { getContext } from 'svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useTextInput,
    useRendererMessages,
    PasswordSegments,
    CellPresentationContextSymbol,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();
  const cell = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding);
  const otpLength = $derived(binding.control.schema.maxLength);
  const segmented = $derived(
    !cell &&
      binding.control.uischema.options?.variant === 'otp' &&
      typeof binding.control.schema.minLength === 'number' &&
      typeof otpLength === 'number' &&
      Number.isInteger(otpLength) &&
      otpLength > 0 &&
      (binding.control.data === undefined ||
        (typeof binding.control.data === 'string' &&
          Array.from(binding.control.data).length <= otpLength)),
  );
  let show = $state(false);
  const message = useRendererMessages();
  const showLabel = $derived(message('password.show'));
  const hideLabel = $derived(message('password.hide'));
  const clearLabel = $derived(message('control.clearValue'));
  const changeValue = (value: unknown) => {
    if (binding.control.enabled) binding.onChange(value);
  };

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: show ? 'text' : 'password',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'ps-9',
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
      oninput: text.oninput,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if segmented}
    <div class="flex min-w-0 items-center gap-2">
      <PasswordSegments
        value={typeof binding.control.data === 'string' ? binding.control.data : ''}
        length={otpLength!}
        schema={binding.control.schema}
        path={binding.control.path}
        id={`${binding.control.id}-input`}
        label={binding.control.label ?? ''}
        revealed={show}
        disabled={!binding.control.enabled}
        readonly={binding.control.readonly}
        invalid={!!binding.control.errors}
        required={!!binding.control.required}
        onchange={(value) => {
          changeValue(value);
          binding.handleBlur();
        }}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      >
        {#snippet input(attributes)}
          <input {...attributes} class="input w-10 shrink-0 px-1 text-center" />
        {/snippet}
      </PasswordSegments>
      <PasswordToggle
        label={show ? hideLabel : showLabel}
        revealed={show}
        disabled={!binding.control.enabled}
        onclick={() => (show = !show)}
        class="size-8"
      />
      {#if binding.clearable && binding.control.data}
        <button
          type="button"
          class="size-8"
          aria-label={clearLabel}
          disabled={!binding.control.enabled}
          onclick={() => {
            changeValue(clearValue);
            binding.handleBlur();
          }}><XIcon class="size-4" /></button
        >
      {/if}
    </div>
  {:else}
    <div class="group relative w-full">
      <PasswordToggle
        label={show ? hideLabel : showLabel}
        revealed={show}
        disabled={!binding.control.enabled}
        onclick={() => (show = !show)}
        class="hover:preset-tonal size-8"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      />
      <input {...inputprops} class={twMerge('input w-full', inputprops.class)} />
      {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => text.clear()}
          disabled={!binding.control.enabled}
          aria-label={clearLabel}
        >
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>
  {/if}
</ControlWrapper>
