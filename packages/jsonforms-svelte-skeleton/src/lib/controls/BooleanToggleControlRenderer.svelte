<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const booleanState = useBooleanState(() => binding.control.data);
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled) binding.onChange(value);
  };
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
      checked: booleanState.checked,
      onCheckedChange: (details: { checked: boolean }) => changeBoolean(details.checked),
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': booleanState.describeWith(skeletonProps['aria-describedby'], stateId),
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
      'aria-label': binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined,
      'aria-invalid': !!binding.control.errors,
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': booleanState.describeWith(skeletonProps['aria-describedby'], stateId),
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
  {#if booleanState.hint !== undefined}
    <span id={stateId} class="sr-only" data-boolean-state>{booleanState.hint}</span>
  {/if}
</ControlWrapper>
