<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { twMerge } from 'tailwind-merge';
  import { useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const booleanState = useBooleanState(() => binding.control.data);
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled) binding.onChange(value);
  };
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
      checked: booleanState.checked,
      indeterminate: booleanState.indeterminate,
      oninput: (e: Event) => changeBoolean((e.target as HTMLInputElement).checked),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': booleanState.describeWith(skeletonProps['aria-describedby'], stateId),
      'aria-label': binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <input
    {...inputprops}
    type="checkbox"
    class={twMerge('checkbox border-surface-400-600 border', inputprops.class)}
  />
  {#if booleanState.hint !== undefined}
    <span id={stateId} class="sr-only" data-boolean-state>{booleanState.hint}</span>
  {/if}
</ControlWrapper>
