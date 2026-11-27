<script lang="ts">
  import { checkboxClass } from '../util/checkboxClass';
  import {
    EnumArrayGroup,
    useJsonFormsMultiEnumControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useSkeletonControl(useJsonFormsMultiEnumControl(props));

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    return {
      ...skeletonProps,
      class: twMerge(
        'checkbox border border-surface-400-600',
        checkboxClass(binding.styles.control.input),
        skeletonProps.class,
      ),
      disabled: !binding.control.enabled,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <EnumArrayGroup {props} {binding}>
    {#snippet item(optionId, label, isChecked, disabled, toggle)}
      <label class="flex items-center gap-2">
        <input
          {...inputprops}
          type="checkbox"
          id={optionId}
          bind:checked={isChecked, (value) => toggle(value === true)}
          {disabled}
        />
        <span>{label}</span>
      </label>
    {/snippet}
  </EnumArrayGroup>
</ControlWrapper>
