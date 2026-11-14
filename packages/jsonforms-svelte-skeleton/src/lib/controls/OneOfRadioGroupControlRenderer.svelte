<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    invalidEnumValueText,
    resolveRadioVertical,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsOneOfEnumControl(props));
  const choices = $derived(enumChoices(binding.control.options));
  const invalidValue = $derived(
    invalidEnumValueText(binding.control.options, binding.control.data),
  );
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const initialChoiceId = untrack(
    () => choices.find((option) => option.id === selectedId)?.id ?? choices[0]?.id,
  );
  const vertical = $derived(
    resolveRadioVertical(binding.control.uischema.options, binding.control.config),
  );

  const describedBy = $derived.by(() => {
    const authored = binding.skeletonProps('SegmentedControl.ItemHiddenInput')['aria-describedby'];
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    return (
      [
        authored,
        helpVisible ? `${binding.control.id}-help` : undefined,
        invalidValue !== undefined ? `${binding.control.id}-invalid-value` : undefined,
      ]
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
        .join(' ') || undefined
    );
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
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
          />
        </SegmentedControl.Item>
      {/each}
    </SegmentedControl.Control>
  </SegmentedControl>
  {#if invalidValue !== undefined}
    <p
      id={`${binding.control.id}-invalid-value`}
      class="text-sm text-red-600 dark:text-red-400"
      role="status"
    >
      {message('control.invalidCurrentValue', { value: invalidValue })}
    </p>
  {/if}
</ControlWrapper>
