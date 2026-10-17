<script lang="ts">
  import {
    enumChoices,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsOneOfEnumControl(props));
  const choices = $derived(enumChoices(binding.control.options));
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));

  const value = $derived(selectedId);

  const handleValueChange = (next: string) => {
    const option = choices.find((candidate) => candidate.id === next);
    if (option) binding.onChange(option.value);
  };
</script>

<ControlWrapper {...binding.controlWrapper}>
  <RadioGroup.Root
    {value}
    onValueChange={handleValueChange}
    disabled={!binding.control.enabled}
    required={binding.control.required}
    orientation={binding.appliedOptions.vertical ? 'vertical' : 'horizontal'}
    class={binding.appliedOptions.vertical ? 'grid gap-3' : 'flex flex-wrap gap-4'}
    aria-invalid={!!binding.control.errors}
    {...binding.shadcnProps('RadioGroup')}
  >
    {#each choices as option, index (option.id)}
      {@const itemId = `${binding.control.id}-option-${index}`}
      <div class="flex items-center gap-2">
        <RadioGroup.Item
          id={index === 0 ? `${binding.control.id}-input` : itemId}
          value={option.id}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
        />
        <Label for={index === 0 ? `${binding.control.id}-input` : itemId}>{option.label}</Label>
      </div>
    {/each}
  </RadioGroup.Root>
</ControlWrapper>
