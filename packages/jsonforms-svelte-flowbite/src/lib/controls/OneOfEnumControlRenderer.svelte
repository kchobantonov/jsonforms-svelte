<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Select } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const input = useFlowbiteControl(
    useJsonFormsOneOfEnumControl(props),
    (value) => (value === null ? clearValue : value),
    300,
  );

  const selectItems = $derived(
    input.control.options.map((option) => ({
      value: option.value,
      name: option.label,
    })),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge('w-full', input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      items: selectItems,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      value: input.control.data,
      clearable: input.clearable,
      onchange: (e: Event) => input.onChange((e.target as HTMLSelectElement).value),
      clearableOnClick: () => {
        input.onChange(clearValue);
      },
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
    };
  });
</script>

<ControlWrapper {...input.controlWrapper}>
  <Select {...inputprops}></Select>
</ControlWrapper>
