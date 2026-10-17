<script lang="ts">
  import {
    enumChoices,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import Select from './components/LocalizedSelect.svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const binding = useFlowbiteControl(useJsonFormsOneOfEnumControl(props), (value) => value, 300);

  const choices = $derived(enumChoices(binding.control.options));
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const selectChoice = (id: string) => {
    const option = choices.find((candidate) => candidate.id === id);
    if (option) binding.onChange(option.value);
    else if (id === '') binding.onChange(clearValue);
  };

  const selectItems = $derived(
    choices.map((option) => ({
      value: option.id,
      name: option.label,
    })),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge('w-full', binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      items: selectItems,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: selectedId,
      clearable: binding.clearable,
      onchange: (e: Event) => selectChoice((e.target as HTMLSelectElement).value),
      onClear: () => {
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
  <Select {...inputprops}></Select>
</ControlWrapper>
