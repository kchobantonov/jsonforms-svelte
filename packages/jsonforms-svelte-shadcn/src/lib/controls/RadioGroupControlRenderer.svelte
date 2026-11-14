<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    invalidEnumValueText,
    resolveRadioVertical,
    selectedEnumId,
    type ControlProps,
    useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import { untrack } from 'svelte';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsEnumControl(props));
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

  const value = $derived(selectedId);
  const describedBy = $derived.by(() => {
    const authored = binding.shadcnProps('RadioGroup.Item')['aria-describedby'];
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
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
        .join(' ') || undefined
    );
  });

  const handleValueChange = (next: string) => {
    const option = choices.find((candidate) => candidate.id === next);
    if (option) binding.onChange(option.value);
  };
</script>

<ControlWrapper {...binding.controlWrapper}>
  <RadioGroup.Root
    data-radio-orientation={vertical ? 'vertical' : 'horizontal'}
    {value}
    onValueChange={handleValueChange}
    disabled={!binding.control.enabled}
    required={binding.control.required}
    orientation={vertical ? 'vertical' : 'horizontal'}
    class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-4'}
    aria-invalid={!!binding.control.errors}
    {...binding.shadcnProps('RadioGroup')}
    aria-label={binding.shadcnProps('RadioGroup')['aria-label'] ?? binding.control.label}
  >
    {#each choices as option, index (option.id)}
      {@const itemId = `${binding.control.id}-option-${index}`}
      <div class="flex items-center gap-2">
        <RadioGroup.Item
          {...binding.shadcnProps('RadioGroup.Item')}
          id={index === 0 ? `${binding.control.id}-input` : itemId}
          aria-describedby={describedBy}
          autofocus={option.id === initialChoiceId && binding.initialFocus}
          value={option.id}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
        />
        <Label for={index === 0 ? `${binding.control.id}-input` : itemId}>{option.label}</Label>
      </div>
    {/each}
  </RadioGroup.Root>
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
