<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import SearchableChoice from './components/SearchableChoice.svelte';
  import {
    useEnumSelect,
    type useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import Select from './components/LocalizedSelect.svelte';
  import { selectProps } from '../util/selectProps';
  import ControlWrapper from './ControlWrapper.svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';

  const props: { control: ReturnType<typeof useJsonFormsEnumControl> } = $props();

  const clearValue = determineClearValue('');

  const binding = useFlowbiteControl(props.control, (value) => value, 300);

  const field = useEnumSelect(binding, () => binding.onChange(clearValue));
  const { choices, invalidValue, selectedId, selectItems } = $derived(field);
  const { selectChoice } = field;

  const describedBy = $derived(
    field.describedBy(binding.flowbiteProps('Select')['aria-describedby']),
  );

  const inputprops = $derived.by(() => {
    return {
      ...selectProps(binding),
      items: selectItems,
      value: selectedId,
      onchange: (e: Event) => selectChoice((e.target as HTMLSelectElement).value),
      onClear: () => {
        binding.onChange(clearValue);
      },
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
  <InvalidChoiceValue controlId={binding.control.id} value={invalidValue} />
</ControlWrapper>
