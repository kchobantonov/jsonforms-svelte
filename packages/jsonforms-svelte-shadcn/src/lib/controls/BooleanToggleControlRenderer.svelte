<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Switch } from '$lib/components/ui/switch';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Switch
    id={`${binding.control.id}-input`}
    checked={!!binding.control.data}
    onCheckedChange={(checked) => binding.onChange(checked)}
    disabled={!binding.control.enabled}
    required={binding.control.required}
    autofocus={binding.appliedOptions.focus}
    aria-invalid={!!binding.control.errors}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    {...binding.shadcnProps('Switch')}
  />
</ControlWrapper>
