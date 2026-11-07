<script lang="ts">
  import {
    enumChoices,
    enumChoicesWithImportedValues,
    enumChoiceDisabled,
    useAuthoredConfig,
    resolveRestrict,
    hasEnumValue,
    useRendererMessages,
    useJsonFormsMultiEnumControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const binding = useFlowbiteControl(useJsonFormsMultiEnumControl(props));
  const message = useRendererMessages();
  const vertical = $derived(props.uischema.options?.vertical === true);
  const choices = $derived(
    enumChoices(enumChoicesWithImportedValues(binding.control.options, binding.control.data)),
  );

  function disabled(value: unknown): boolean {
    return (
      !binding.control.enabled ||
      !binding.control.visible ||
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

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    role="group"
    aria-label={binding.control.label}
    aria-describedby={binding.control.required ? `${binding.control.id}-required` : undefined}
    onfocusin={binding.handleFocus}
    onfocusout={binding.handleBlur}
    class={`flex gap-2 ${vertical ? 'flex-col' : 'flex-row flex-wrap'}`}
  >
    {#if binding.control.required}<span id={`${binding.control.id}-required`} class="sr-only"
        >{message('control.required')}</span
      >{/if}
    {#each choices as option (option.id)}
      <Checkbox
        {...inputprops}
        id={binding.control.id + '-' + option.id}
        bind:checked={
          () => dataHasEnum(option.value), (checked) => toggle(option.value, checked === true)
        }
        disabled={disabled(option.value)}>{option.label}</Checkbox
      >
    {/each}
  </div>
</ControlWrapper>
