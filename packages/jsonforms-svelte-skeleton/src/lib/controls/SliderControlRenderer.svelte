<script lang="ts">
  import { XIcon } from '@lucide/svelte';
  import type { ComponentProps } from 'svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useSliderInput,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Portal, Slider, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    determineClearValue,
    getPortalRootNodeGetter,
    getPortalTarget,
    useSkeletonControl,
  } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const binding = useSkeletonControl(useJsonFormsControl(props));
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

  const getPortalRootNode = getPortalRootNodeGetter();
  let sliderContainer: HTMLDivElement | undefined = $state();
  const getRootNode = () => sliderContainer?.getRootNode() ?? getPortalRootNode();
  const thumbId = $derived(`${binding.control.id}-slider-thumb`);
  let thumbHovered = $state(false);
  let thumbFocused = $state(false);
  let thumbDragging = $state(false);
  const tooltipOpen = $derived(
    binding.control.enabled && (thumbHovered || thumbFocused || thumbDragging),
  );

  const sliderProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Slider');

    return {
      ...skeletonProps,
      getRootNode,
      ids: { thumb: () => thumbId },
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !slider.enabled,
      invalid: !!binding.control.errors || slider.state.invalid || !!slider.error,
      onkeydowncapture: slider.activateSingleValue,
      onpointerup: slider.activateSingleValue,
      readOnly: binding.control.readonly,
      value: [slider.state.position],
      step: slider.state.step,
      min: slider.state.minimum,
      max: slider.state.maximum,
      onValueChange: (details: { value: number[] }) => slider.change(details.value[0]),
      required: binding.control.required,
      'aria-label': [binding.control.label],
      getAriaValueText: () => slider.valueText,
    };
  });
</script>

<svelte:window
  onpointerup={() => (thumbDragging = false)}
  onpointercancel={() => (thumbDragging = false)}
/>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, slider.error].filter(Boolean).join('\n')}
>
  <div bind:this={sliderContainer} class="group/slider flex flex-row items-center gap-2">
    {#if binding.control.schema.minimum !== undefined}
      <p class="text-sm">{binding.control.schema.minimum}</p>
    {/if}
    <!-- Zag measures the thumb on mount; resolve the containing shadow root first. -->
    {#if sliderContainer}
      <Slider {...sliderProps} class="flex-1">
        <Slider.Control class="flex items-center" onpointerdown={() => (thumbDragging = true)}>
          <Slider.Track class="bg-surface-300-700 relative h-2 w-full rounded-full">
            <Slider.Range class="bg-primary-500 absolute h-full rounded-full" />
          </Slider.Track>
          <Tooltip
            ids={{ trigger: thumbId }}
            open={tooltipOpen}
            openDelay={0}
            closeDelay={0}
            closeOnPointerDown={false}
            positioning={{ placement: 'top', strategy: 'fixed', gutter: 8 }}
            {getRootNode}
          >
            <Tooltip.Trigger>
              {#snippet element(triggerProps)}
                <!-- Tooltip exposes nullable HTML attributes; Slider uses narrower native prop types. -->
                <Slider.Thumb
                  {...triggerProps as Partial<ComponentProps<typeof Slider.Thumb>>}
                  index={0}
                  aria-describedby={stateId}
                  class={twMerge(
                    'border-surface-200-800 bg-surface-50-950 size-4 rounded-full border shadow-sm',
                    typeof triggerProps.class === 'string' ? triggerProps.class : '',
                  )}
                  onpointerenter={() => (thumbHovered = true)}
                  onpointerleave={() => (thumbHovered = false)}
                  onfocus={() => (thumbFocused = true)}
                  onblur={() => (thumbFocused = false)}
                >
                  <Slider.HiddenInput
                    id={`${binding.control.id}-input`}
                    onfocus={binding.handleFocus}
                    onblur={binding.handleBlur}
                  />
                </Slider.Thumb>
              {/snippet}
            </Tooltip.Trigger>
            <Portal target={getPortalTarget()}>
              <Tooltip.Context>
                {#snippet children(tooltip)}
                  <div {...tooltip().getPositionerProps()}>
                    <Tooltip.Content
                      data-slot="slider-value-tooltip"
                      class="preset-filled-surface-950-50 rounded-base pointer-events-none relative z-50 min-w-6 px-2 py-1 text-center text-xs leading-none font-medium shadow-md"
                    >
                      {slider.valueText}
                      <span
                        aria-hidden="true"
                        class="preset-filled-surface-950-50 pointer-events-none absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
                      ></span>
                    </Tooltip.Content>
                  </div>
                {/snippet}
              </Tooltip.Context>
            </Portal>
          </Tooltip>
        </Slider.Control>
      </Slider>
    {/if}
    {#if binding.control.schema.maximum !== undefined}
      <p class="text-sm">{binding.control.schema.maximum}</p>
    {/if}
    {#if slider.canClear}<button
        type="button"
        class="btn-icon btn-icon-sm preset-tonal shrink-0 opacity-0 group-focus-within/slider:opacity-100 group-hover/slider:opacity-100 [@media(hover:none)]:opacity-100"
        aria-label={message('control.clearValue')}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={slider.clear}><XIcon class="size-4" /></button
      >{/if}
  </div>
  <span id={stateId} class={slider.state.missing || slider.state.invalid ? 'text-sm' : 'sr-only'}
    >{slider.valueText}</span
  >
</ControlWrapper>
