<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsOneOfEnumControl(props));

  const segmentedProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('SegmentedControl');

    return {
      ...skeletonProps,
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      orientation: binding.appliedOptions.vertical
        ? ('vertical' as const)
        : ('horizontal' as const),
      value: binding.control.data ?? null,
      onValueChange: (details: { value: string | null }) => binding.onChange(details.value),
      required: binding.control.required,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <SegmentedControl {...segmentedProps}>
    <SegmentedControl.Control
      class={twMerge(
        'btn-group preset-outlined-surface-200-800 flex w-full gap-1 p-1',
        binding.appliedOptions.vertical ? 'flex-col' : 'flex-row',
      )}
    >
      <SegmentedControl.Indicator class="preset-filled-primary-500 rounded-base shadow-sm" />
      {#each binding.control.options as option, index (option.value)}
        <SegmentedControl.Item
          value={String(option.value)}
          disabled={!binding.control.enabled}
          class="btn relative flex-1 justify-center"
        >
          <SegmentedControl.ItemText>{option.label}</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput
            id={index === 0 ? `${binding.control.id}-input` : undefined}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
          />
        </SegmentedControl.Item>
      {/each}
    </SegmentedControl.Control>
  </SegmentedControl>
</ControlWrapper>
