<script lang="ts">
  import { type ControlProps, useJsonFormsEnumControl } from '@chobantonov/jsonforms-svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
  import ControlWrapper from './ControlWrapper.svelte';
  import { determineClearValue, getPortalTarget, useShadcnControl } from '../util';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(
    useJsonFormsEnumControl(props),
    (value) => (value === null ? clearValue : value),
    300,
  );

  const selectedValue = $derived(
    binding.control.data === undefined ||
      binding.control.data === null ||
      binding.control.data === ''
      ? undefined
      : String(binding.control.data),
  );
  const selectedLabel = $derived(
    binding.control.options.find((option) => String(option.value) === selectedValue)?.label,
  );
  const placeholder = $derived(binding.appliedOptions.placeholder ?? 'Select an option');

  const handleValueChange = (value: string) => {
    const option = binding.control.options.find((candidate) => String(candidate.value) === value);
    binding.onChange(option?.value ?? clearValue);
  };
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Select.Root
      type="single"
      value={selectedValue}
      onValueChange={handleValueChange}
      disabled={!binding.control.enabled}
      required={binding.control.required}
      name={binding.control.path}
      {...binding.shadcnProps('Select')}
    >
      <Select.Trigger
        id={`${binding.control.id}-input`}
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
        {#each binding.control.options as option (String(option.value))}
          <Select.Item value={String(option.value)} label={option.label}>{option.label}</Select.Item
          >
        {/each}
      </Select.Content>
    </Select.Root>

    {#if binding.clearable && selectedValue !== undefined}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        aria-label="Clear value"
      >
        <XIcon />
      </Button>
    {/if}
  </div>
</ControlWrapper>
