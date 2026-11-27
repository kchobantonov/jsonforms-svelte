<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanControl,
    BooleanField,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Switch } from '@jsonforms-svelte-shadcn-ui/switch';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import BooleanClearButton from './components/BooleanClearButton.svelte';

  const { toggle, ...props }: ControlProps & { toggle?: boolean } = $props();

  const binding = useShadcnControl(useJsonFormsControl(props));
  const control = useBooleanControl(props, binding, determineClearValue(false));
  const booleanState = control.state;
  const vendorProps = $derived(binding.shadcnProps(toggle ? 'Switch' : 'Checkbox'));
  const input = $derived({
    ...vendorProps,
    ...control.inputAttributes(vendorProps['aria-describedby']),
    checked: booleanState.checked,
    onCheckedChange: (checked: boolean) => control.change(checked),
    required: binding.control.required,
    name: undefined,
  });
</script>

<BooleanField
  {control}
  wrapperProps={binding.controlWrapper}
  {ControlWrapper}
  {BooleanClearButton}
  center={!toggle && !!binding.appliedOptions.hideControlWrapper}
>
  {#if toggle}
    <Switch {...input} disabled={!binding.control.enabled || binding.control.readonly} />
  {:else}
    <Checkbox
      {...input}
      indeterminate={booleanState.indeterminate}
      disabled={!binding.control.enabled}
      readonly={binding.control.readonly}
    />
  {/if}
</BooleanField>
