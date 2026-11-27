<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    scopeDataSegments,
    useRendererMessages,
    useSliderInput,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { XIcon } from '$lib/components/icons';
  import { Slider } from 'bits-ui';
  import { onMount } from 'svelte';
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
    get pathSegments() {
      return [
        ...(props.pathSegments ?? (props.path ? props.path.split('.') : [])),
        ...scopeDataSegments(props.uischema.scope),
      ];
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
  const describedBy = $derived.by(() => {
    const authored = binding.shadcnProps('Slider')['aria-describedby'];
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        !!slider.error ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    return [authored, stateId, helpVisible ? `${binding.control.id}-help` : undefined]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');
  });
  let sliderRoot: HTMLElement | null = $state(null);
  let thumbFocused = $state(false);
  let thumbHovered = $state(false);

  onMount(() => {
    if (!binding.initialFocus) return;
    const frame = requestAnimationFrame(() => {
      const thumb = sliderRoot?.querySelector<HTMLElement>('[role="slider"]');
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
    <Slider.Root
      bind:ref={sliderRoot}
      {...binding.shadcnProps('Slider')}
      type="single"
      id={`${binding.control.id}-input`}
      data-slot="slider"
      class="relative flex w-full flex-1 touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col"
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
    >
      {#snippet children({ thumbItems })}
        <span
          data-slot="slider-track"
          data-orientation={binding.shadcnProps('Slider').orientation ?? 'horizontal'}
          class="bg-muted relative grow overflow-hidden rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <Slider.Range
            data-slot="slider-range"
            class="bg-primary absolute data-horizontal:h-full data-vertical:w-full"
          />
        </span>
        {#each thumbItems as thumb (thumb.index)}
          <Slider.Thumb
            index={thumb.index}
            data-slot="slider-thumb"
            aria-label={binding.control.label}
            aria-labelledby={binding.shadcnProps('Slider')['aria-labelledby']}
            aria-describedby={describedBy}
            aria-required={binding.control.required}
            aria-invalid={!!binding.control.errors || slider.state.invalid || !!slider.error}
            aria-valuetext={slider.valueText}
            class="border-ring ring-ring/50 relative block size-3 shrink-0 rounded-full border bg-white after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
            onfocus={() => (thumbFocused = true)}
            onblur={() => (thumbFocused = false)}
            onpointerenter={() => (thumbHovered = true)}
            onpointerleave={() => (thumbHovered = false)}
          />
          <Slider.ThumbLabel
            index={thumb.index}
            data-slot="slider-value-tooltip"
            aria-hidden="true"
            class={`border-border bg-popover text-popover-foreground pointer-events-none z-50 mb-2 min-w-6 rounded-md border px-2 py-1 text-center text-xs font-medium shadow-md after:absolute after:top-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-e after:border-b after:border-inherit after:bg-inherit data-active:visible ${thumbFocused || thumbHovered ? 'visible' : 'invisible'}`}
          >
            {slider.valueText}
          </Slider.ThumbLabel>
        {/each}
      {/snippet}
    </Slider.Root>
    {#if binding.control.schema.maximum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.maximum}</span>
    {/if}
    {#if slider.canClear}<Button
        variant="ghost"
        size="icon-xs"
        class="shrink-0 opacity-0 group-focus-within/slider:opacity-100 group-hover/slider:opacity-100 [@media(hover:none)]:opacity-100"
        title={message('control.clearValue')}
        aria-label={message('control.clearValue')}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={slider.clear}><XIcon class="size-4" /></Button
      >{/if}
  </div>
  <span id={stateId} class={slider.state.missing || slider.state.invalid ? 'text-sm' : 'sr-only'}
    >{slider.valueText}</span
  >
</ControlWrapper>
