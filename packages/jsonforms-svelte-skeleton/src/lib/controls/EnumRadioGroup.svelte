<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useRadioGroup } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { type useJsonFormsEnumControl } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from './ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: { control: ReturnType<typeof useJsonFormsEnumControl> } = $props();

  const binding = useSkeletonControl(props.control);
  const radio = useRadioGroup(binding);
  const { choices, invalidValue, selectedId, vertical, initialChoiceId } = $derived(radio);

  const describedBy = $derived.by(() => {
    const authored = binding.skeletonProps('SegmentedControl.ItemHiddenInput')['aria-describedby'];
    return radio.describe(authored);
  });

  const segmentedProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('SegmentedControl');

    return {
      ...skeletonProps,
      'aria-label':
        typeof skeletonProps['aria-label'] === 'string'
          ? skeletonProps['aria-label']
          : (binding.control.label ?? ''),
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      orientation: vertical ? ('vertical' as const) : ('horizontal' as const),
      value: selectedId,
      onValueChange: (details: { value: string | null }) => {
        const option = choices.find((candidate) => candidate.id === details.value);
        if (option) binding.onChange(option.value);
      },
      required: binding.control.required,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <SegmentedControl
    {...segmentedProps}
    data-radio-orientation={vertical ? 'vertical' : 'horizontal'}
  >
    <SegmentedControl.Control
      class={twMerge(
        'btn-group preset-outlined-surface-200-800 flex w-full gap-1 p-1',
        vertical ? 'flex-col' : 'flex-row',
      )}
    >
      <SegmentedControl.Indicator class="preset-filled-primary-500 rounded-base shadow-sm" />
      {#each choices as option, index (option.id)}
        <SegmentedControl.Item
          {...index === 0 ? { for: `${binding.control.id}-input` } : {}}
          value={option.id}
          disabled={!binding.control.enabled}
          class="btn relative flex-1 justify-center"
        >
          <SegmentedControl.ItemText>{option.label}</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput
            {...binding.skeletonProps('SegmentedControl.ItemHiddenInput')}
            id={index === 0 ? `${binding.control.id}-input` : undefined}
            aria-describedby={describedBy}
            autofocus={option.id === initialChoiceId && binding.initialFocus}
            {...binding.focusEvents()}
          />
        </SegmentedControl.Item>
      {/each}
    </SegmentedControl.Control>
  </SegmentedControl>
  <InvalidChoiceValue controlId={binding.control.id} value={invalidValue} />
</ControlWrapper>
