<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';

  import * as InputOTP from '@jsonforms-svelte-shadcn-ui/input-otp';
  import {
    type ControlProps,
    usePasswordField,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { XIcon } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { usePasswordOtp } from '../util/passwordOtp.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const { binding } = useShadcnTextControl(props, clearValue);
  const field = usePasswordField(binding);
  const { password, text } = field;
  const { otpLength, segmented } = $derived(password);

  const otp = usePasswordOtp(
    binding,
    () => otpLength ?? 0,
    () => segmented,
  );
  const show = $derived(field.revealed);
  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');
    return {
      ...shadcnProps,
      ...field.inputAttributes(shadcnProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        'ps-9',
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if password.segmented}
    <div class="group/otp flex min-w-0 items-center gap-2">
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
        autofocus={binding.initialFocus}
        pasteTransformer={(text) => text}
        pushPasswordManagerStrategy="none"
        disabled={!binding.control.enabled}
        readonly={binding.control.readonly}
        aria-invalid={!!binding.control.errors}
        aria-describedby={inputprops['aria-describedby']}
        required={!!binding.control.required}
        onfocus={(event) => {
          binding.handleFocus();
          otp.onfocus(event);
        }}
        onblur={otp.onblur}
        class="flex min-w-0 items-center overflow-x-auto has-disabled:opacity-50"
      >
        {#snippet children({ cells })}
          <InputOTP.Group class="min-w-0 flex-1">
            {#each otp.cells(cells) as cell, index (index)}
              <InputOTP.Slot
                cell={{ ...cell, char: cell.char && !show ? '•' : cell.char }}
                aria-hidden="true"
                aria-invalid={!!binding.control.errors}
                class="min-w-6 shrink"
              />
            {/each}
          </InputOTP.Group>
        {/snippet}
      </InputOTP.Root>
      <PasswordToggle {...field.toggleProps} />
      {#if binding.clearable && binding.control.data}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="invisible group-focus-within/otp:visible group-hover/otp:visible"
          title={password.clearLabel}
          aria-label={password.clearLabel}
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
        {...field.toggleProps}
        class="jf-password-toggle absolute inset-y-0 my-auto select-none"
      />
      <Input {...inputprops} />
      {#if field.showClear}
        <InputClearButton {...text.clearButton} label={password.clearLabel} />
      {/if}
    </div>
  {/if}
</ControlWrapper>

<style>
  :global(.jf-password-toggle) {
    inset-inline-start: calc(0.25rem + var(--jf-start-adornment-space, 0px));
  }
</style>
