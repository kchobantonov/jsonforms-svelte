<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useRadioGroup } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { type useJsonFormsEnumControl } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: { control: ReturnType<typeof useJsonFormsEnumControl> } = $props();
  const binding = useShadcnControl(props.control);
  const radio = useRadioGroup(binding);
  const { choices, invalidValue, selectedId, vertical, initialChoiceId } = $derived(radio);

  const value = $derived(selectedId);
  const describedBy = $derived.by(() => {
    const authored = binding.shadcnProps('RadioGroup.Item')['aria-describedby'];
    return radio.describe(authored);
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
  <InvalidChoiceValue controlId={binding.control.id} value={invalidValue} />
</ControlWrapper>
