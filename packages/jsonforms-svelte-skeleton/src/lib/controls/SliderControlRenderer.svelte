<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
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

  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value);
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);

  const resolveSliderValue = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
  };

  const defaultValue = $derived.by(() =>
    resolveSliderValue(binding.control.schema.default, binding.control.schema.minimum ?? 0),
  );

  const effectiveValue = $derived.by(() => resolveSliderValue(binding.control.data, defaultValue));

  const portalTarget = getPortalTarget();
  const getRootNode = getPortalRootNodeGetter();
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
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      readOnly: !binding.control.enabled,
      value: [effectiveValue],
      step: binding.control.schema.multipleOf ?? 1,
      min: binding.control.schema.minimum,
      max: binding.control.schema.maximum,
      onValueChange: (details: { value: number[] }) => binding.onChange(details.value[0]),
      required: binding.control.required,
    };
  });
</script>

<svelte:window
  onpointerup={() => (thumbDragging = false)}
  onpointercancel={() => (thumbDragging = false)}
/>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex flex-row items-center gap-2">
    {#if binding.control.schema.minimum !== undefined}
      <p class="text-sm">{binding.control.schema.minimum}</p>
    {/if}
    <Slider {...sliderProps} class="flex-1">
      <Slider.Control class="flex items-center" onpointerdown={() => (thumbDragging = true)}>
        <Slider.Track class="bg-surface-300-700 relative h-2 w-full rounded-full">
          <Slider.Range class="bg-primary-500 absolute h-full rounded-full" />
        </Slider.Track>
        <Tooltip
          open={tooltipOpen}
          openDelay={0}
          closeDelay={0}
          closeOnPointerDown={false}
          positioning={{ placement: 'top', strategy: 'fixed', gutter: 8 }}
          {getRootNode}
        >
          <Tooltip.Trigger>
            {#snippet element(triggerProps)}
              <Slider.Thumb
                {...triggerProps as any}
                index={0}
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
          <Portal target={portalTarget}>
            <Tooltip.Context>
              {#snippet children(tooltip)}
                <div {...tooltip().getPositionerProps()}>
                  <Tooltip.Content
                    data-slot="slider-value-tooltip"
                    class="preset-filled-surface-950-50 rounded-base pointer-events-none relative z-50 min-w-6 px-2 py-1 text-center text-xs leading-none font-medium shadow-md"
                  >
                    {effectiveValue}
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
    {#if binding.control.schema.maximum !== undefined}
      <p class="text-sm">{binding.control.schema.maximum}</p>
    {/if}
  </div>
</ControlWrapper>
