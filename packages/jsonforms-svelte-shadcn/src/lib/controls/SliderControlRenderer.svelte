<script lang="ts">
  import { SliderValueStatus } from '@chobantonov/jsonforms-svelte-renderer-common';

  import {
    type ControlProps,
    useJsonFormsControl,
    useSliderControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { XIcon } from '$lib/components/icons';
  import { Slider } from '@jsonforms-svelte-shadcn-ui/slider';
  import { Portal } from 'bits-ui';
  import { onMount } from 'svelte';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const clearValue = determineClearValue(0);
  const binding = useShadcnControl(useJsonFormsControl(props));
  const slider = useSliderControl(props, binding, clearValue);
  const describedBy = $derived.by(() => {
    const authored = binding.shadcnProps('Slider')['aria-describedby'];
    return slider.describedBy(authored);
  });
  let sliderRoot: HTMLElement | null = $state(null);
  const thumb = $derived.by(() => sliderRoot?.querySelector<HTMLElement>('[role="slider"]'));
  // The stock component forwards props to its root. The thumb owns keyboard focus.
  $effect(() => {
    if (!thumb) return;
    thumb.ariaLabel = binding.control.label;
    const labelledBy = binding.shadcnProps('Slider')['aria-labelledby'];
    if (labelledBy) thumb.setAttribute('aria-labelledby', labelledBy);
    else thumb.removeAttribute('aria-labelledby');
    thumb.setAttribute('aria-describedby', describedBy);
    thumb.ariaRequired = String(!!binding.control.required);
    thumb.ariaInvalid = String(!!binding.control.errors || slider.state.invalid || !!slider.error);
    thumb.ariaValueText = slider.valueText;
  });

  onMount(() => {
    if (!binding.initialFocus) return;
    const frame = requestAnimationFrame(() => {
      if (slider.enabled && thumb?.checkVisibility({ checkVisibilityCSS: true })) thumb.focus();
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, slider.error].filter(Boolean).join('\n')}
>
  <div
    class="group/slider flex items-center gap-3"
    aria-invalid={!!binding.control.errors}
    onfocusin={binding.handleFocus}
    onfocusout={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) binding.handleBlur();
    }}
  >
    {#if binding.control.schema.minimum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.minimum}</span>
    {/if}
    <Slider
      bind:ref={sliderRoot}
      {...binding.shadcnProps('Slider')}
      type="single"
      id={`${binding.control.id}-input`}
      class="flex-1"
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
    />
    {#if thumb}
      <Portal to={thumb}>
        <span
          data-slot="slider-value-tooltip"
          aria-hidden="true"
          class="slider-value-tooltip border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 min-w-6 -translate-x-1/2 rounded-md border px-2 py-1 text-center text-xs font-medium shadow-md after:absolute after:top-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-e after:border-b after:border-inherit after:bg-inherit"
          >{slider.valueText}</span
        >
      </Portal>
    {/if}
    {#if binding.control.schema.maximum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.maximum}</span>
    {/if}
    {#if slider.canClear}<Button
        variant="ghost"
        size="icon-xs"
        class="shrink-0 opacity-0 group-focus-within/slider:opacity-100 group-hover/slider:opacity-100 [@media(hover:none)]:opacity-100"
        {...slider.clearButton}><XIcon class="size-4" /></Button
      >{/if}
  </div>
  <SliderValueStatus id={slider.stateId} {slider} />
</ControlWrapper>

<style>
  .slider-value-tooltip {
    visibility: hidden;
  }

  :global([role='slider']:is(:hover, :focus, :active, [data-active])) .slider-value-tooltip {
    visibility: visible;
  }
</style>
