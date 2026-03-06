<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { twMerge } from 'tailwind-merge';
  import { useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const withoutInputUtility = (value?: string) =>
    (value ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== 'input')
      .join(' ');

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(withoutInputUtility(binding.styles.control.input), skeletonProps.class),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      checked: !!binding.control.data,
      indeterminate: binding.control.data === undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).checked),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <input
    {...inputprops}
    type="checkbox"
    class={twMerge('checkbox border border-surface-400-600', inputprops.class)}
  />
</ControlWrapper>
