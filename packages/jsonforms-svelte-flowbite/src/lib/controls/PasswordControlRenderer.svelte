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
  import { Input, CloseButton } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();
  const cell = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
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
    const flowbiteProps = binding.flowbiteProps('Input');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    const describedBy = [
      flowbiteProps['aria-describedby'],
      helpVisible ? `${binding.control.id}-help` : undefined,
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');

    return {
      ...flowbiteProps,
      type: show ? 'text' : 'password',
      id: `${binding.control.id}-input`,
      class: twMerge(
        'ps-9',
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
      clearable: false,
      oninput: text.oninput,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if segmented}
    <div class="group/otp flex min-w-0 items-center gap-2">
      <PasswordSegments
        value={typeof binding.control.data === 'string' ? binding.control.data : ''}
        length={otpLength!}
        autofocus={binding.initialFocus}
        schema={binding.control.schema}
        path={binding.control.path}
        id={`${binding.control.id}-input`}
        label={binding.control.label ?? ''}
        revealed={show}
        disabled={!binding.control.enabled}
        readonly={binding.control.readonly}
        invalid={!!binding.control.errors}
        describedBy={inputprops['aria-describedby']}
        required={!!binding.control.required}
        onchange={(value) => {
          changeValue(value);
          binding.handleBlur();
        }}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      >
        {#snippet input(attributes)}
          <div class="w-10 min-w-6 shrink">
            <Input {...attributes} class="px-1 text-center" />
          </div>
        {/snippet}
      </PasswordSegments>
      <PasswordToggle
        label={show ? hideLabel : showLabel}
        revealed={show}
        disabled={!binding.control.enabled}
        onclick={() => (show = !show)}
      />
      {#if binding.clearable && binding.control.data}
        <CloseButton
          name={clearLabel}
          class="invisible group-focus-within/otp:visible group-hover/otp:visible"
          ariaLabel={clearLabel}
          disabled={!binding.control.enabled}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            changeValue(clearValue);
            binding.handleBlur();
          }}
        />
      {/if}
    </div>
  {:else}
    <div class="group/clear w-full">
      <Input {...inputprops}>
        {#snippet left()}
          <PasswordToggle
            label={show ? hideLabel : showLabel}
            revealed={show}
            disabled={!binding.control.enabled}
            onclick={() => (show = !show)}
            class="pointer-events-auto border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0"
          />
        {/snippet}
        {#snippet right()}
          {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
            <CloseButton
              name={clearLabel}
              ariaLabel={clearLabel}
              size="sm"
              disabled={!binding.control.enabled}
              class="pointer-events-auto invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
              onmousedown={(event: MouseEvent) => event.preventDefault()}
              onclick={(event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                text.clear();
              }}
            />
          {/if}
        {/snippet}
      </Input>
    </div>
  {/if}
</ControlWrapper>
