<script lang="ts">
  import { type ControlProps, useJsonFormsEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Label } from '$lib/components/ui/label';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsEnumControl(props));
  const value = $derived(binding.control.data == null ? '' : String(binding.control.data));

  const handleValueChange = (next: string) => {
    const option = binding.control.options.find((candidate) => String(candidate.value) === next);
    binding.onChange(option?.value ?? next);
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
    {#each binding.control.options as option, index (String(option.value))}
      {@const itemId = `${binding.control.id}-option-${index}`}
      <div class="flex items-center gap-2">
        <RadioGroup.Item
          id={index === 0 ? `${binding.control.id}-input` : itemId}
          value={String(option.value)}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
        />
        <Label for={index === 0 ? `${binding.control.id}-input` : itemId}>{option.label}</Label>
      </div>
    {/each}
  </RadioGroup.Root>
</ControlWrapper>
