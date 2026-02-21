<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Input } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    const sug = props.uischema.options?.suggestion;
    if (sug === undefined || !Array.isArray(sug) || !sug.every((s) => typeof s === 'string')) {
      return undefined;
    }
    return sug as string[];
  });

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue, 300);

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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      clearable: binding.clearable,
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onSelect: (item: string) => binding.onChange(item),
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
  <Input {...inputprops}></Input>
</ControlWrapper>
