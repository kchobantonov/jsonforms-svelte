<script lang="ts">
  import { untrack } from 'svelte';
  import {
    useNumericField,
    useRendererMessages,
    type ControlProps,
    useJsonFormsControl,
    NumericFieldFrame,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import { useTranslator } from '@chobantonov/jsonforms-svelte';
  import { Input, CloseButton } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const { integer, ...props }: ControlProps & { integer: boolean } = $props();
  const t = useTranslator();

  const clearValue = determineClearValue(0);

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const field = useNumericField(
    binding,
    clearValue,
    untrack(() => integer),
  );

  const { numeric } = field;

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    return {
      ...flowbiteProps,

      ...field.attributes(flowbiteProps['aria-describedby']),
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      placeholder: binding.appliedOptions.placeholder,
      clearable: binding.clearable && !field.incompatible,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} errors={field.errors}>
  <NumericFieldFrame {binding} {field} groupClass="group/clear">
    <!-- Flowbite excludes null from InputValue, but Svelte emits null for incomplete numeric input. -->
    <Input
      {...inputprops}
      bind:value={() => numeric.value as string | number | undefined, numeric.nativeValue}
      clearable={false}
    />
    {#snippet clearButton()}
      <CloseButton
        color="none"
        class="invisible absolute end-1 top-1/2 -translate-y-1/2 group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
        disabled={!binding.control.enabled || binding.control.readonly}
        name={t.value('numeric.clearValue', message('control.clearValue'))}
        title={t.value('numeric.clearValue', message('control.clearValue'))}
        ariaLabel={t.value('numeric.clearValue', message('control.clearValue'))}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={(event: MouseEvent) => {
          event.preventDefault();
          numeric.clear();
        }}
      />
    {/snippet}
  </NumericFieldFrame>
</ControlWrapper>
