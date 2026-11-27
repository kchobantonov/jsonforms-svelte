<script lang="ts">
  import {
    EnumArrayGroup,
    useJsonFormsMultiEnumControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import * as Field from '@jsonforms-svelte-shadcn-ui/field';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useShadcnControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnControl(useJsonFormsMultiEnumControl(props));
</script>

<ControlWrapper {...binding.controlWrapper}>
  <EnumArrayGroup {props} {binding}>
    {#snippet item(optionId, label, isChecked, disabled, toggle)}
      <Field.Label for={optionId} class="flex items-center gap-2">
        <Checkbox
          {...binding.shadcnProps('Checkbox')}
          id={optionId}
          bind:checked={isChecked, (value) => toggle(value === true)}
          {disabled}
        />
        <span>{label}</span>
      </Field.Label>
    {/snippet}
  </EnumArrayGroup>
</ControlWrapper>
