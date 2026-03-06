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

  const sliderProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Slider');

    return {
      ...skeletonProps,
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      readOnly: !binding.control.enabled,
      value: [binding.control.data ?? binding.control.schema.minimum ?? 0],
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
        <Slider.Track class="relative h-2 w-full rounded-full bg-surface-300-700">
          <Slider.Range class="absolute h-full rounded-full bg-primary-500" />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          class="size-4 rounded-full border border-surface-200-800 bg-surface-50-950 shadow-sm"
        />
      </Slider.Control>
      <Slider.HiddenInput
        id={`${binding.control.id}-input`}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      />
    </Slider>
    {#if binding.control.schema.maximum !== undefined}
      <p class="text-sm">{binding.control.schema.maximum}</p>
    {/if}
  </div>
</ControlWrapper>
