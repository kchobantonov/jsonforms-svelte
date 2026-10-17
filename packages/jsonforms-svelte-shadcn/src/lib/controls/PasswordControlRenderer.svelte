<script lang="ts">
  import { getContext } from 'svelte';
  import * as InputOTP from '@jsonforms-svelte-shadcn-ui/input-otp';
  import {
    type ControlProps,
    useJsonFormsControl,
    useTextInput,
    useRendererMessages,
    CellPresentationContextSymbol,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { usePasswordOtp } from '../util/passwordOtp.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();
  const cell = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);
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
  const otp = usePasswordOtp(
    binding,
    () => otpLength ?? 0,
    () => segmented,
  );
  let show = $state(false);
  const message = useRendererMessages();
  const showLabel = $derived(message('password.show'));
  const hideLabel = $derived(message('password.hide'));
  const clearLabel = $derived(message('control.clearValue'));

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: show ? 'text' : 'password',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
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
      <InputOTP.Root
        value={otp.value}
        maxlength={otpLength! * 2}
        oninputcapture={otp.oninputcapture}
        onpastecapture={otp.onpastecapture}
        onkeydowncapture={otp.onkeydowncapture}
        oncompositionstart={otp.oncompositionstart}
        oncompositionend={otp.oncompositionend}
        inputId={`${binding.control.id}-input`}
        aria-label={binding.control.label ?? ''}
        type={show ? 'text' : 'password'}
        inputmode="text"
        pasteTransformer={(text) => text}
        disabled={!binding.control.enabled}
        readonly={binding.control.readonly}
        aria-invalid={!!binding.control.errors}
        required={!!binding.control.required}
        onfocus={(event) => {
          binding.handleFocus();
          otp.onfocus(event);
        }}
        onblur={otp.onblur}
        class="flex min-w-0 items-center overflow-x-auto has-disabled:opacity-50"
      >
        {#snippet children({ cells })}
          <InputOTP.Group>
            {#each otp.cells(cells) as cell, index (index)}
              <InputOTP.Slot
                cell={{ ...cell, char: cell.char && !show ? '•' : cell.char }}
                aria-hidden="true"
                aria-invalid={!!binding.control.errors}
                class="shrink-0"
              />
            {/each}
          </InputOTP.Group>
        {/snippet}
      </InputOTP.Root>
      <PasswordToggle
        label={show ? hideLabel : showLabel}
        revealed={show}
        disabled={!binding.control.enabled}
        onclick={() => (show = !show)}
      />
      {#if binding.clearable && binding.control.data}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={clearLabel}
          disabled={!binding.control.enabled}
          onclick={() => {
            otp.clear();
          }}><XIcon class="size-4" /></Button
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
        class="absolute inset-y-0 start-1 my-auto"
      />
      <Input {...inputprops} />
      {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
        <Button
          variant="ghost"
          size="icon-xs"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => text.clear()}
          disabled={!binding.control.enabled}
          aria-label={clearLabel}
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>
  {/if}
</ControlWrapper>
