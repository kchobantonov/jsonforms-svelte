<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const inputId = $derived(`${binding.control.id}-input`);

  const switchProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Switch');
    const ids =
      skeletonProps.ids && typeof skeletonProps.ids === 'object'
        ? (skeletonProps.ids as Record<string, unknown>)
        : {};

    return {
      ...skeletonProps,
      ids: {
        ...ids,
        hiddenInput: inputId,
      },
      disabled: !binding.control.enabled,
      checked: !!binding.control.data,
      onCheckedChange: (details: { checked: boolean }) => binding.onChange(details.checked),
      required: binding.control.required,
      invalid: !!binding.control.errors,
    };
  });

  const hiddenInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Switch.HiddenInput');

    return {
      ...skeletonProps,
      autofocus: binding.appliedOptions.focus,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Switch {...switchProps}>
    <Switch.Control {...binding.skeletonProps('Switch.Control')}>
      <Switch.Thumb {...binding.skeletonProps('Switch.Thumb')} />
    </Switch.Control>
    <Switch.HiddenInput {...hiddenInputProps} />
  </Switch>
</ControlWrapper>
