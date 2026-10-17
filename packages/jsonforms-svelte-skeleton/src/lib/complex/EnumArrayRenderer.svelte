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
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useSkeletonControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const binding = useSkeletonControl(useJsonFormsMultiEnumControl(props));
  const choices = $derived(
    enumChoices(enumChoicesWithImportedValues(binding.control.options, binding.control.data)),
  );

  const withoutInputUtility = (value?: string) =>
    (value ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== 'input')
      .join(' ');

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

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');

    return {
      ...skeletonProps,
      class: twMerge(
        'checkbox border border-surface-400-600',
        withoutInputUtility(binding.styles.control.input),
        skeletonProps.class,
      ),
      disabled: !binding.control.enabled,
    };
  });
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
      <label class="flex items-center gap-2">
        <input
          {...inputprops}
          type="checkbox"
          id={binding.control.id + '-' + option.id}
          bind:checked={
            () => dataHasEnum(option.value), (checked) => toggle(option.value, checked === true)
          }
          disabled={disabled(option.value)}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</ControlWrapper>
