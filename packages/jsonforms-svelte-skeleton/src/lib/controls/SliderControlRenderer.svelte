<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
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

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex flex-row items-center gap-2">
    {#if binding.control.schema.minimum !== undefined}
      <p class="text-sm">{binding.control.schema.minimum}</p>
    {/if}
    <Slider {...sliderProps} class="flex-1">
      <Slider.Control class="flex items-center">
        <Slider.Track class="bg-surface-300-700 relative h-2 w-full rounded-full">
          <Slider.Range class="bg-primary-500 absolute h-full rounded-full" />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          class="border-surface-200-800 bg-surface-50-950 size-4 rounded-full border shadow-sm"
        >
          <Slider.HiddenInput
            id={`${binding.control.id}-input`}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
          />
        </Slider.Thumb>
      </Slider.Control>
    </Slider>
    {#if binding.control.schema.maximum !== undefined}
      <p class="text-sm">{binding.control.schema.maximum}</p>
    {/if}
  </div>
</ControlWrapper>
