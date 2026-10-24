<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import BooleanClearButton from './components/BooleanClearButton.svelte';

  const props: ControlProps = $props();

  const binding = useShadcnControl(useJsonFormsControl(props));
  const clearValue = determineClearValue(false);
  const canClear = $derived(
    binding.control.visible && binding.clearable && binding.control.data !== undefined,
  );
  const clearBoolean = () => {
    if (canClear) binding.onChange(booleanState.arrayItem ? false : clearValue);
  };
  const booleanState = useBooleanState(
    () => binding.control.data,
    () => binding.control.path,
  );
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled && !binding.control.readonly) binding.onChange(value);
  };
</script>

<div
  class="group/boolean inline-flex max-w-full gap-1"
  class:items-center={binding.appliedOptions.hideControlWrapper}
  class:items-start={!binding.appliedOptions.hideControlWrapper}
>
  <ControlWrapper {...binding.controlWrapper} layout="horizontal">
    <Checkbox
      {...binding.shadcnProps('Checkbox')}
      id={`${binding.control.id}-input`}
      checked={booleanState.checked}
      indeterminate={booleanState.indeterminate}
      onCheckedChange={(checked) => changeBoolean(checked)}
      disabled={!binding.control.enabled}
      readonly={binding.control.readonly}
      required={binding.control.required}
      name={undefined}
      aria-required={binding.control.required}
      aria-describedby={booleanState.describeWith(
        binding.shadcnProps('Checkbox')['aria-describedby'],
        stateId,
      )}
      autofocus={binding.appliedOptions.focus}
      aria-label={binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined}
      aria-invalid={!!binding.control.errors}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
    />
    {#if booleanState.hint !== undefined}
      <span id={stateId} class="sr-only" data-boolean-state>{booleanState.hint}</span>
    {/if}
  </ControlWrapper>
  {#if canClear}<BooleanClearButton onclick={clearBoolean} />{/if}
</div>
