<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { ControlWrapper, useSkeletonControl } from '@chobantonov/jsonforms-svelte-skeleton';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = undefined;
  const binding = useSkeletonControl(useJsonFormsControl(props));

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      checked: binding.control.data === null,
      indeterminate: binding.control.data === undefined,
      oninput: (event: Event) =>
        binding.onChange((event.target as HTMLInputElement).checked ? null : clearValue),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
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
