<script lang="ts">
  import SearchableChoice from './components/SearchableChoice.svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    enumChoices,
    invalidEnumValueText,
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
  const invalidValue = $derived(
    invalidEnumValueText(binding.control.options, binding.control.data),
  );
  const selectedValue = $derived(selectedEnumId(binding.control.options, binding.control.data));
  const selectedLabel = $derived(choices.find((option) => option.id === selectedValue)?.label);
  const placeholder = $derived(
    binding.appliedOptions.placeholder ?? message('control.selectOption'),
  );
  const selectContentProps = $derived(binding.shadcnProps('Select.Content'));
  const controlId = $derived(props.uischema.label === false ? componentId : binding.control.id);

  const describedBy = $derived.by(() => {
    const authored = binding.shadcnProps('Select.Trigger')['aria-describedby'];
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    return (
      [
        authored,
        helpVisible ? `${controlId}-help` : undefined,
        invalidValue !== undefined ? `${controlId}-invalid-value` : undefined,
      ]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join(' ') || undefined
    );
  });

  const handleValueChange = (value: string) => {
    const option = choices.find((candidate) => candidate.id === value);
    if (option) binding.onChange(option.value);
  };
</script>

<ControlWrapper {...binding.controlWrapper} id={controlId}>
  <div class="group relative w-full">
    {#if binding.appliedOptions.autocomplete === true}
      <SearchableChoice
        id={`${controlId}-input`}
        label={binding.control.label}
        items={choices}
        value={selectedValue ?? ''}
        disabled={!binding.control.enabled}
        focus={binding.initialFocus}
        readonly={binding.control.readonly}
        required={binding.control.required}
        invalid={!!binding.control.errors}
        {placeholder}
        class="h-10 w-full justify-between pe-16"
        {describedBy}
        onselect={handleValueChange}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      />
    {:else}
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
          autofocus={binding.initialFocus}
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
          aria-describedby={describedBy}
        >
          <span
            class={selectedLabel ? 'min-w-0 truncate' : 'text-muted-foreground min-w-0 truncate'}
            >{selectedLabel ?? placeholder}</span
          >
        </Select.Trigger>
        <Select.Content
          portalProps={{ to: getPortalTarget() }}
          {...selectContentProps}
          class={twMerge('max-w-[calc(100dvw-1rem)]', selectContentProps.class)}
        >
          {#each choices as option (option.id)}
            <Select.Item
              value={option.id}
              label={option.label}
              class="max-w-full min-w-0 [&>span:last-child]:min-w-0 [&>span:last-child]:break-words [&>span:last-child]:whitespace-normal"
              >{option.label}</Select.Item
            >
          {/each}
        </Select.Content>
      </Select.Root>
    {/if}

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
  {#if invalidValue !== undefined}
    <p
      id={`${controlId}-invalid-value`}
      class="text-sm text-red-600 dark:text-red-400"
      role="status"
    >
      {message('control.invalidCurrentValue', { value: invalidValue })}
    </p>
  {/if}
</ControlWrapper>
