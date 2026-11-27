<script lang="ts">
  import {
    nullCheckbox,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useSkeletonControl } from '@chobantonov/jsonforms-svelte-skeleton';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const binding = useSkeletonControl(useJsonFormsControl(props));

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    const checkbox = nullCheckbox(binding, skeletonProps['aria-describedby']);
    return {
      ...skeletonProps,
      ...checkbox.attributes,
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      oninput: checkbox.oninput,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <input
    {...inputProps}
    type="checkbox"
    class={twMerge('checkbox border-surface-400-600 border', inputProps.class)}
  />
</ControlWrapper>
