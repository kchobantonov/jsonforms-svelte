<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Checkbox, ControlWrapper, useShadcnControl } from '@chobantonov/jsonforms-svelte-shadcn';

  const props: ControlProps = $props();
  const clearValue = undefined;
  const binding = useShadcnControl(useJsonFormsControl(props));
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Checkbox
    id={`${binding.control.id}-input`}
    checked={binding.control.data === null}
    indeterminate={binding.control.data === undefined}
    onCheckedChange={(checked) => binding.onChange(checked ? null : clearValue)}
    disabled={!binding.control.enabled}
    autofocus={binding.appliedOptions.focus}
    required={binding.control.required}
    aria-invalid={!!binding.control.errors}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    {...binding.shadcnProps('Checkbox')}
  />
</ControlWrapper>
