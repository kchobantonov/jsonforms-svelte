<script lang="ts">
  import {
    nullCheckbox,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useShadcnControl } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
  const checkbox = $derived(
    nullCheckbox(binding, binding.shadcnProps('Checkbox')['aria-describedby']),
  );
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Checkbox
    {...checkbox.attributes}
    onCheckedChange={checkbox.change}
    disabled={!binding.control.enabled}
    {...binding.shadcnProps('Checkbox')}
    aria-describedby={checkbox.describedBy}
    readonly={binding.control.readonly}
  />
</ControlWrapper>
