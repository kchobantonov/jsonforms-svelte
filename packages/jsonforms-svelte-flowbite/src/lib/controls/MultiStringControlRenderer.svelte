<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Textarea } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const input = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue, 300);

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Textarea');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge(
        input.clearable ? 'pr-9' : '',
        'w-full',
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
    };
  });
</script>

<ControlWrapper {...input.controlWrapper}>
  <Textarea {...inputprops}></Textarea>
</ControlWrapper>
