<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { untrack } from 'svelte';
  import {
    useNumericField,
    type ControlProps,
    useJsonFormsControl,
    NumericFieldFrame,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const { integer, ...props }: ControlProps & { integer: boolean } = $props();

  const clearValue = determineClearValue(0);

  const binding = useShadcnControl(useJsonFormsControl(props));
  const field = useNumericField(
    binding,
    clearValue,
    untrack(() => integer),
  );

  const { numeric } = field;

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');
    return {
      ...shadcnProps,
      ...field.attributes(shadcnProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      placeholder: binding.appliedOptions.placeholder,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} errors={field.errors}>
  <NumericFieldFrame {binding} {field} {InputClearButton}>
    <Input {...inputprops} bind:value={() => numeric.value, numeric.nativeValue} />
  </NumericFieldFrame>
</ControlWrapper>
