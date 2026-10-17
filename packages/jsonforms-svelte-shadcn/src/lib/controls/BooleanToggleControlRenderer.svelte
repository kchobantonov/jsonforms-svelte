<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { Switch } from '@jsonforms-svelte-shadcn-ui/switch';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
  const booleanState = useBooleanState(() => binding.control.data);
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled) binding.onChange(value);
  };
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Switch
    {...binding.shadcnProps('Switch')}
    id={`${binding.control.id}-input`}
    checked={booleanState.checked}
    onCheckedChange={(checked) => changeBoolean(checked)}
    disabled={!binding.control.enabled}
    required={binding.control.required}
    name={undefined}
    aria-required={binding.control.required}
    aria-describedby={booleanState.describeWith(
      binding.shadcnProps('Switch')['aria-describedby'],
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
