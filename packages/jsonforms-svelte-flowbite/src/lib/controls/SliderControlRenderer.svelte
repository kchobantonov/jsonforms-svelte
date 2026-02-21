<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { P, Range, Tooltip } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value);
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Range');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      step: binding.control.schema.multipleOf || 1,
      min: binding.control.schema.minimum,
      max: binding.control.schema.maximum,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });

  const instanceId = counter++;
  const thumbAnchorId = $derived(`${binding.control.id}-thumb-${instanceId}`);

  const percentage = $derived.by(() => {
    const min = binding.control.schema.minimum ?? 0;
    const max = binding.control.schema.maximum ?? 100;
    const value = binding.control.data ?? min;

    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex flex-row items-center gap-2">
    {#if binding.control.schema.minimum !== undefined}
      <P class="text-sm">{binding.control.schema.minimum}</P>
    {/if}
    <div class="relative flex-1">
      <Range {...inputprops} />
      <Tooltip reference={`#${CSS.escape(thumbAnchorId)}`}>
        {binding.control.data}
      </Tooltip>

      <div
        id={thumbAnchorId}
        class="pointer-events-none absolute top-1/2
         h-4 w-4 -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={`left: ${percentage}%`}
      ></div>
    </div>
    {#if binding.control.schema.maximum !== undefined}
      <P class="text-sm">{binding.control.schema.maximum}</P>
    {/if}
  </div>
</ControlWrapper>
