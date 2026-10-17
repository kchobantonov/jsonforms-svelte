<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, CloseButton } from 'flowbite-svelte';
  const message = useRendererMessages();
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    const sug = props.uischema.options?.suggestion;
    if (sug === undefined || !Array.isArray(sug) || !sug.every((s) => typeof s === 'string')) {
      return undefined;
    }
    return sug as string[];
  });

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding);

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
  <Input {...inputprops} clearable={false}>
    {#snippet right()}
      {#if binding.clearable && text.value !== undefined && text.value !== '' && text.value !== null}
        <CloseButton
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          color="none"
          ariaLabel={message('control.clearValue')}
          name={message('control.clearValue')}
          disabled={!binding.control.enabled}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            text.clear();
          }}
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>
