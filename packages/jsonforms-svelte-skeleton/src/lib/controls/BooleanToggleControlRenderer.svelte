<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanControl,
    BooleanField,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import BooleanClearButton from './components/BooleanClearButton.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const control = useBooleanControl(props, binding, determineClearValue(false));
  const booleanState = control.state;
  const describedBy = $derived(
    control.describedBy(binding.skeletonProps('Switch.HiddenInput')['aria-describedby']),
  );
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
      readOnly: binding.control.readonly,
      checked: booleanState.checked,
      onCheckedChange: (details: { checked: boolean }) => control.change(details.checked),
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': booleanState.describeWith(
        skeletonProps['aria-describedby'],
        control.stateId,
      ),
      invalid: !!binding.control.errors,
    };
  });

  const hiddenInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Switch.HiddenInput');

    return {
      ...skeletonProps,
      autofocus: binding.initialFocus,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      'aria-label': binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined,
      'aria-invalid': !!binding.control.errors,
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': describedBy,
    };
  });
</script>

<BooleanField {control} wrapperProps={binding.controlWrapper} {ControlWrapper} {BooleanClearButton}>
  <Switch {...switchProps}>
    <Switch.Control {...binding.skeletonProps('Switch.Control')}>
      <Switch.Thumb {...binding.skeletonProps('Switch.Thumb')} />
    </Switch.Control>
    <Switch.HiddenInput {...hiddenInputProps} />
  </Switch>
</BooleanField>
