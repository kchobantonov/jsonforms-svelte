<script lang="ts">
  import {
    enumChoices,
    enumChoicesWithImportedValues,
    enumChoiceDisabled,
    useAuthoredConfig,
    resolveRestrict,
    hasEnumValue,
    useJsonFormsMultiEnumControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import * as Field from '@jsonforms-svelte-shadcn-ui/field';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useShadcnControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const binding = useShadcnControl(useJsonFormsMultiEnumControl(props));
  const choices = $derived(
    enumChoices(enumChoicesWithImportedValues(binding.control.options, binding.control.data)),
  );

  function disabled(value: unknown): boolean {
    return (
      !binding.control.enabled ||
      binding.control.readonly ||
      enumChoiceDisabled(binding.control.data, value, binding.control.schema, restrict)
    );
  }
  function toggle(value: unknown, checked: boolean) {
    if (disabled(value) || checked === dataHasEnum(value)) return;
    if (checked) {
      if (!(binding.control.options ?? []).some((option) => hasEnumValue([option.value], value)))
        return;
      binding.addItem(binding.control.path, value);
    } else binding.removeItem?.(binding.control.path, value);
  }

  function dataHasEnum(value: unknown): boolean {
    return hasEnumValue(binding.control.data, value);
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    role="group"
    aria-label={binding.control.label}
    onfocusin={binding.handleFocus}
    onfocusout={binding.handleBlur}
    class={`flex gap-2 ${binding.appliedOptions.vertical ? 'flex-col' : 'flex-row flex-wrap'}`}
  >
    {#each choices as option (option.id)}
      {@const optionId = `${binding.control.id}-${option.id}`}
      <Field.Label for={optionId} class="flex items-center gap-2">
        <Checkbox
          {...binding.shadcnProps('Checkbox')}
          id={optionId}
          bind:checked={
            () => dataHasEnum(option.value), (checked) => toggle(option.value, checked === true)
          }
          disabled={disabled(option.value)}
        />
        <span>{option.label}</span>
      </Field.Label>
    {/each}
  </div>
</ControlWrapper>
