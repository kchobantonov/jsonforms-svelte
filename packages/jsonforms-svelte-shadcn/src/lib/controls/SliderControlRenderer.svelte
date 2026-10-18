<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useSliderInput,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { XIcon } from '$lib/components/icons';
  import { Slider } from '@jsonforms-svelte-shadcn-ui/slider';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const clearValue = determineClearValue(0);
  const binding = useShadcnControl(useJsonFormsControl(props));
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
</script>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, slider.error].filter(Boolean).join('\n')}
>
  <div class="group/slider flex items-center gap-3" aria-invalid={!!binding.control.errors}>
    {#if binding.control.schema.minimum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.minimum}</span>
    {/if}
    <Slider
      {...binding.shadcnProps('Slider')}
      type="single"
      id={`${binding.control.id}-input`}
      class="flex-1"
      showValue
      value={slider.state.position}
      min={slider.state.minimum}
      max={slider.state.maximum}
      step={slider.state.step}
      disabled={!slider.enabled}
      aria-invalid={!!binding.control.errors || slider.state.invalid || !!slider.error}
      onValueChange={(value: number) => slider.change(value)}
      onkeydown={slider.activateSingleValue}
      onpointerup={slider.activateSingleValue}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      aria-label={binding.control.label}
      aria-required={binding.control.required}
      aria-valuetext={slider.valueText}
      aria-describedby={stateId}
    />
    {#if binding.control.schema.maximum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.maximum}</span>
    {/if}
    {#if slider.canClear}<Button
        variant="ghost"
        size="icon-xs"
        class="shrink-0 opacity-0 group-focus-within/slider:opacity-100 group-hover/slider:opacity-100 [@media(hover:none)]:opacity-100"
        aria-label={message('control.clearValue')}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={slider.clear}><XIcon class="size-4" /></Button
      >{/if}
  </div>
  <span id={stateId} class={slider.state.missing || slider.state.invalid ? 'text-sm' : 'sr-only'}
    >{slider.valueText}</span
  >
</ControlWrapper>
