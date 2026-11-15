<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    invalidEnumValueText,
    resolveRadioVertical,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Radio } from 'flowbite-svelte';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const binding = useFlowbiteControl(useJsonFormsOneOfEnumControl(props));
  const choices = $derived(enumChoices(binding.control.options));
  const invalidValue = $derived(
    invalidEnumValueText(binding.control.options, binding.control.data),
  );
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const initialChoiceId = untrack(
    () => choices.find((option) => option.id === selectedId)?.id ?? choices[0]?.id,
  );
  const vertical = $derived(
    resolveRadioVertical(binding.control.uischema.options, binding.control.config),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Radio');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    const describedBy = [
      flowbiteProps['aria-describedby'],
      helpVisible ? `${binding.control.id}-help` : undefined,
      invalidValue !== undefined ? `${binding.control.id}-invalid-value` : undefined,
    ]
      .filter((item): item is string => typeof item === 'string' && item.length > 0)
      .join(' ');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby': describedBy || undefined,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    data-radio-orientation={vertical ? 'vertical' : 'horizontal'}
    role="radiogroup"
    aria-label={binding.control.label}
    onfocusin={binding.handleFocus}
    onfocusout={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) binding.handleBlur();
    }}
    class={`flex gap-2 ${vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each choices as option, index (option.id)}
      <Radio
        {...inputprops}
        id={index === 0 ? `${binding.control.id}-input` : `${binding.control.id}-${option.id}`}
        autofocus={option.id === initialChoiceId && binding.initialFocus}
        value={option.id}
        group={selectedId}
        onchange={() => binding.onChange(option.value)}
      >
        {option.label}
      </Radio>
    {/each}
  </div>
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
