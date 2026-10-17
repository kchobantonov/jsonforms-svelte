<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, CloseButton } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { JsonSchema } from '@jsonforms/core';

  const props: ControlProps = $props();
  const message = useRendererMessages();
  let inputElement = $state<HTMLInputElement>();

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const findEnumSchema = (schemas: JsonSchema[]) =>
    schemas.find((s) => s.enum !== undefined && (s.type === 'string' || s.type === undefined));

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    return findEnumSchema(binding.control.schema.anyOf!)!.enum!;
  });

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding, 0);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      type: 'text',
      ...flowbiteProps,

      data: suggestions,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
      clearable: binding.clearable,
      maxlength: undefined,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      oninput: text.oninput,
      onSelect: (item: string) => text.change(item),
      clearableOnClick: () => {
        text.clear();
      },
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Input {...inputprops} clearable={false} bind:elementRef={inputElement}>
    {#snippet right()}
      {#if binding.clearable && text.value !== undefined && text.value !== '' && text.value !== null}
        <CloseButton
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          color="none"
          name={message('control.clearValue')}
          ariaLabel={message('control.clearValue')}
          disabled={!binding.control.enabled}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            if (!binding.control.enabled) return;
            text.clear();
            inputElement?.focus({ preventScroll: true });
          }}
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>
