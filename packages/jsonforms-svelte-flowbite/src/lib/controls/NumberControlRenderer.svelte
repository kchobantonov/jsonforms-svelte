<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Input } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const input = useFlowbiteControl(useJsonFormsControl(props), (value) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Input');

    return {
      step: input.appliedOptions.step ?? 0.1,
      ...flowbiteProps,

      type: 'number',
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
