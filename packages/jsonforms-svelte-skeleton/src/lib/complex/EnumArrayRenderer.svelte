<script lang="ts">
  import { useJsonFormsMultiEnumControl, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const binding = useSkeletonControl(useJsonFormsMultiEnumControl(props));
  const withoutInputUtility = (value?: string) =>
    (value ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== 'input')
      .join(' ');

  function dataHasEnum(value: any): boolean {
    return !!binding.control.data?.includes(value);
  }

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    return {
      ...skeletonProps,
      class: twMerge(
        'checkbox border border-surface-400-600',
        withoutInputUtility(binding.styles.control.input),
        skeletonProps.class,
      ),
      disabled: !binding.control.enabled,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    class={`flex gap-2 ${binding.appliedOptions.vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each binding.control.options as option, index (option.value)}
      <label class="flex items-center gap-2">
        <input
          {...inputprops}
          type="checkbox"
          id={binding.control.id + '-' + option.value}
          checked={dataHasEnum(option.value)}
          oninput={(e: Event) =>
            (e.target as HTMLInputElement).checked
              ? binding.addItem(binding.control.path, option.value)
              : binding.removeItem?.(binding.control.path, option.value)}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</ControlWrapper>
