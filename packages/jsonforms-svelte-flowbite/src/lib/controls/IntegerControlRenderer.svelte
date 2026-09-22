<script lang="ts">
  import {
    NumericValueHint,
    useTranslator,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, Button } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const t = useTranslator();

  const clearValue = determineClearValue(0);

  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : parseInt(value, 10);
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);

  const handleIntegerKeyDown = (event: KeyboardEvent) => {
    // Disallow decimal/exponent notation for integer-only input.
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  };

  const handleIntegerPaste = (event: ClipboardEvent) => {
    const pasted = event.clipboardData?.getData('text')?.trim() ?? '';
    if (pasted.length === 0) return;
    if (!/^[+-]?\d+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  const incompatibleValue = $derived(
    binding.control.data !== undefined &&
      binding.control.data !== null &&
      typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,

      type: 'number',
      step: binding.appliedOptions.step ?? binding.control.schema.multipleOf ?? 1,
      min: binding.control.schema.minimum,
      max: binding.control.schema.maximum,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      'aria-describedby': incompatibleValue ? hintId : undefined,
      clearable: binding.clearable && !incompatibleValue,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onkeydown: handleIntegerKeyDown,
      onpaste: handleIntegerPaste,
      clearableOnClick: () => {
        binding.onChange(clearValue);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex min-w-0 items-center gap-1">
    <div class="group relative min-w-0 flex-1">
      <Input {...inputprops} />
      {#if incompatibleValue && binding.clearable}
        <Button
          size="xs"
          class="absolute inset-y-0 end-1 my-auto h-6 w-6 p-0"
          disabled={!binding.control.enabled}
          onclick={() => binding.onChange(clearValue)}
          aria-label={t.value('numeric.clearValue', 'Clear value')}>×</Button
        >
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
</ControlWrapper>
