<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import { useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Switch');

    return {
      ...skeletonProps,
      class: twMerge(binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      checked: !!binding.control.data,
      onCheckedChange: (details: { checked: boolean }) => binding.onChange(details.checked),
      required: binding.control.required,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Switch {...inputprops}>
    <Switch.Control class={twMerge('preset-filled-surface-300-700 data-[state=checked]:preset-filled-primary-500', inputprops.class)}>
      <Switch.Thumb />
    </Switch.Control>
    <Switch.HiddenInput id={`${binding.control.id}-input`} onfocus={binding.handleFocus} onblur={binding.handleBlur} />
  </Switch>
</ControlWrapper>
