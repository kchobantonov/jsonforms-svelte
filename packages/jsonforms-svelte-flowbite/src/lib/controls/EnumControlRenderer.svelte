<script lang="ts">
  import SearchableChoice from './components/SearchableChoice.svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    invalidEnumValueText,
    selectedEnumId,
    type ControlProps,
    useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import Select from './components/LocalizedSelect.svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const binding = useFlowbiteControl(useJsonFormsEnumControl(props), (value) => value, 300);

  const choices = $derived(enumChoices(binding.control.options));
  const invalidValue = $derived(
    invalidEnumValueText(binding.control.options, binding.control.data),
  );
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const selectChoice = (id: string) => {
    const option = choices.find((candidate) => candidate.id === id);
    if (option) binding.onChange(option.value);
    else if (id === '') binding.onChange(clearValue);
  };

  const selectItems = $derived(
    choices.map((option) => ({
      value: option.id,
      name: option.label,
    })),
  );

  const describedBy = $derived.by(() => {
    const authored = binding.flowbiteProps('Select')['aria-describedby'];
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    return (
      [
        authored,
        helpVisible ? `${binding.control.id}-help` : undefined,
        invalidValue !== undefined ? `${binding.control.id}-invalid-value` : undefined,
      ]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join(' ') || undefined
    );
  });

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge('w-full', binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      items: selectItems,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder,
      value: selectedId,
      clearable: binding.clearable,
      onchange: (e: Event) => selectChoice((e.target as HTMLSelectElement).value),
      onClear: () => {
        binding.onChange(clearValue);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby': describedBy,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if binding.appliedOptions.autocomplete === true}
    <SearchableChoice
      id={inputprops.id}
      label={binding.control.label}
      items={choices}
      value={selectedId}
      disabled={!binding.control.enabled}
      readonly={binding.control.readonly}
      required={binding.control.required}
      invalid={!!binding.control.errors}
      placeholder={binding.appliedOptions.placeholder}
      class={inputprops.class}
      clearable={binding.clearable && binding.control.data !== undefined}
      onclear={() => selectChoice('')}
      {describedBy}
      onselect={selectChoice}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
    />
  {:else}<Select {...inputprops}></Select>{/if}
  {#if invalidValue !== undefined}
    <p
      id={`${binding.control.id}-invalid-value`}
      class="text-sm text-red-600 dark:text-red-400"
      role="status"
    >
      {message('control.invalidCurrentValue', { value: invalidValue })}
    </p>
  {/if}
</ControlWrapper>
