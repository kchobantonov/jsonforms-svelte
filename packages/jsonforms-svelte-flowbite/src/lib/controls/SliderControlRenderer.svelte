<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useSliderInput,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Range, Span, Tooltip, CloseButton } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const message = useRendererMessages();
  const slider = useSliderInput({
    get data() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get enabled() {
      return binding.control.enabled && !binding.control.readonly;
    },
    get clearable() {
      return binding.clearable;
    },
    clearValue,
    onChange: binding.onChange,
  });
  const stateId = $derived(`${binding.control.id}-slider-state`);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Range');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !slider.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: slider.state.position,
      step: slider.state.step,
      min: slider.state.minimum,
      max: slider.state.maximum,
      oninput: (e: Event) => slider.change(Number((e.target as HTMLInputElement).value)),
      onkeydown: slider.activateSingleValue,
      onpointerup: slider.activateSingleValue,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || slider.state.invalid || !!slider.error,
      'aria-label': binding.control.label,
      'aria-required': binding.control.required,
      'aria-valuetext': slider.valueText,
      'aria-describedby': stateId,
    };
  });

  const thumbAnchorId = $derived(`${binding.control.id}-thumb`);

  const percentage = $derived.by(() => {
    const min = slider.state.minimum;
    const max = slider.state.maximum;
    const value = slider.state.position;

    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  });
</script>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, slider.error].filter(Boolean).join('\n')}
>
  <div class="group/slider flex flex-row items-center gap-2">
    {#if binding.control.schema.minimum !== undefined}
      <Span class="text-sm">{binding.control.schema.minimum}</Span>
    {/if}
    <div class="relative flex-1">
      <Range {...inputprops} />
      <Tooltip reference={`#${CSS.escape(thumbAnchorId)}`}>
        {slider.valueText}
      </Tooltip>

      <div
        id={thumbAnchorId}
        class="pointer-events-none absolute top-1/2
         h-4 w-4 -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={`left: ${percentage}%`}
      ></div>
    </div>
    {#if binding.control.schema.maximum !== undefined}
      <Span class="text-sm">{binding.control.schema.maximum}</Span>
    {/if}
    {#if slider.canClear}<CloseButton
        color="gray"
        class="size-6 shrink-0 opacity-0 group-focus-within/slider:opacity-100 group-hover/slider:opacity-100 dark:text-gray-400 [@media(hover:none)]:opacity-100"
        ariaLabel={message('control.clearValue')}
        name={message('control.clearValue')}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={(event: MouseEvent) => {
          event.preventDefault();
          slider.clear();
        }}
      />{/if}
  </div>
  <span id={stateId} class={slider.state.missing || slider.state.invalid ? 'text-sm' : 'sr-only'}
    >{slider.valueText}</span
  >
</ControlWrapper>
