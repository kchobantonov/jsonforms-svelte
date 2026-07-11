<script lang="ts">
  import { useJsonFormsMultiEnumControl, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Field from '$lib/components/ui/field';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useShadcnControl } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const binding = useShadcnControl(useJsonFormsMultiEnumControl(props));
  function dataHasEnum(value: any): boolean {
    return !!binding.control.data?.includes(value);
  }
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    class={`flex gap-2 ${binding.appliedOptions.vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each binding.control.options as option (option.value)}
      {@const optionId = `${binding.control.id}-${option.value}`}
      <Field.Label for={optionId} class="flex items-center gap-2">
        <Checkbox
          id={optionId}
          checked={dataHasEnum(option.value)}
          disabled={!binding.control.enabled}
          onCheckedChange={(checked) =>
            checked
              ? binding.addItem(binding.control.path, option.value)
              : binding.removeItem?.(binding.control.path, option.value)}
          {...binding.shadcnProps('Checkbox')}
        />
        <span>{option.label}</span>
      </Field.Label>
    {/each}
  </div>
</ControlWrapper>
