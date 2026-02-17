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

  const input = useFlowbiteControl(useJsonFormsControl(props), (value) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Range');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge(input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      value: input.control.data,
      step: input.control.schema.multipleOf || 1,
      min: input.control.schema.minimum,
      max: input.control.schema.maximum,
      oninput: (e: Event) => input.onChange((e.target as HTMLInputElement).value),
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
    };
  });

  const instanceId = counter++;
  const thumbAnchorId = $derived(`${input.control.id}-thumb-${instanceId}`);

  const percentage = $derived.by(() => {
    const min = input.control.schema.minimum ?? 0;
    const max = input.control.schema.maximum ?? 100;
    const value = input.control.data ?? min;

    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  });
</script>

<ControlWrapper {...input.controlWrapper}>
  <div class="flex flex-row items-center gap-2">
    {#if input.control.schema.minimum !== undefined}
      <P class="text-sm">{input.control.schema.minimum}</P>
    {/if}
    <div class="relative flex-1">
      <Range {...inputprops} />
      <Tooltip reference={`#${CSS.escape(thumbAnchorId)}`}>
        {input.control.data}
      </Tooltip>

      <div
        id={thumbAnchorId}
        class="pointer-events-none absolute top-1/2
         h-4 w-4 -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={`left: ${percentage}%`}
      ></div>
    </div>
    {#if input.control.schema.maximum !== undefined}
      <P class="text-sm">{input.control.schema.maximum}</P>
    {/if}
  </div>
</ControlWrapper>
