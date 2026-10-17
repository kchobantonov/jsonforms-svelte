<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import ControlWrapper from './ControlWrapper.svelte';
  import { determineClearValue, getPortalTarget, useShadcnControl } from '../util';

  const props: ControlProps = $props();
  const componentId = $props.id();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsOneOfEnumControl(props), (value) => value, 300);

  const choices = $derived(enumChoices(binding.control.options));
  const selectedValue = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const selectedLabel = $derived(choices.find((option) => option.id === selectedValue)?.label);
  const placeholder = $derived(
    binding.appliedOptions.placeholder ?? message('control.selectOption'),
  );
  const controlId = $derived(props.uischema.label === false ? componentId : binding.control.id);

  const handleValueChange = (value: string) => {
    const option = choices.find((candidate) => candidate.id === value);
    if (option) binding.onChange(option.value);
  };
</script>

<ControlWrapper {...binding.controlWrapper} id={controlId}>
  <div class="group relative w-full">
    <Select.Root
      type="single"
      value={selectedValue ?? ''}
      onValueChange={handleValueChange}
      disabled={!binding.control.enabled}
      required={binding.control.required}
      name={binding.control.path}
      {...binding.shadcnProps('Select')}
    >
      <Select.Trigger
        id={`${controlId}-input`}
        class={twMerge(
          binding.styles.control.input,
          'h-10 w-full',
          binding.clearable ? 'pe-16' : '',
        )}
        aria-invalid={!!binding.control.errors}
        aria-label={binding.control.label}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        {...binding.shadcnProps('Select.Trigger')}
      >
        <span class={selectedLabel ? '' : 'text-muted-foreground'}
          >{selectedLabel ?? placeholder}</span
        >
      </Select.Trigger>
      <Select.Content
        portalProps={{ to: getPortalTarget() }}
        {...binding.shadcnProps('Select.Content')}
      >
        {#each choices as option (option.id)}
          <Select.Item value={option.id} label={option.label}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    {#if binding.clearable && binding.control.data !== undefined}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        aria-label={message('control.clearValue')}
      >
        <XIcon />
      </Button>
    {/if}
  </div>
</ControlWrapper>
