<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Input } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    const sug = props.uischema.options?.suggestion;
    if (sug === undefined || !Array.isArray(sug) || !sug.every((s) => typeof s === 'string')) {
      return undefined;
    }
    return sug as string[];
  });

  const input = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue, 300);

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Input');

    return {
      type: 'text',
      ...flowbiteProps,

      data: suggestions,
      id: `${input.control.id}-input`,
      class: twMerge(
        input.clearable ? 'pe-9' : '',
        input.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !input.control.enabled,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      value: input.control.data,
      clearable: input.clearable,
      maxlength: input.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => input.onChange((e.target as HTMLInputElement).value),
      onSelect: (item: string) => input.onChange(item),
      clearableOnClick: () => {
        input.onChange(clearValue);
      },
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
    };
  });
</script>

<ControlWrapper {...input.controlWrapper}>
  <Input {...inputprops}></Input>
</ControlWrapper>
