<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import SelectContent from '../components/SelectContent.svelte';
  import SearchableChoice from './components/SearchableChoice.svelte';
  import {
    useRendererMessages,
    useEnumSelect,
    type useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import XIcon from '@lucide/svelte/icons/x';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import ControlWrapper from './ControlWrapper.svelte';
  import { determineClearValue, useShadcnControl } from '../util';

  const props: { control: ReturnType<typeof useJsonFormsEnumControl> } = $props();
  const componentId = $props.id();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(props.control, (value) => value, 300);

  const field = useEnumSelect(binding);
  const { choices, invalidValue, selectedId: selectedValue } = $derived(field);
  const selectedLabel = $derived(choices.find((option) => option.id === selectedValue)?.label);
  const placeholder = $derived(
    binding.appliedOptions.placeholder ?? message('control.selectOption'),
  );
  const selectContentProps = $derived(binding.shadcnProps('Select.Content'));
  const controlId = $derived(
    binding.control.uischema.label === false ? componentId : binding.control.id,
  );

  const describedBy = $derived(
    field.describedBy(binding.shadcnProps('Select.Trigger')['aria-describedby'], controlId),
  );

  const { selectChoice: handleValueChange } = field;
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
          class={twMerge(binding.styles.control.input, 'h-10 w-full')}
          aria-invalid={!!binding.control.errors}
          aria-label={binding.control.label}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
          {...binding.shadcnProps('Select.Trigger')}
          aria-describedby={describedBy}
        >
          <span
            class={twMerge(
              selectedLabel ? 'min-w-0 truncate' : 'text-muted-foreground min-w-0 truncate',
              binding.clearable ? 'me-8' : '',
            )}>{selectedLabel ?? placeholder}</span
          >
        </Select.Trigger>
        <SelectContent
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
        </SelectContent>
      </Select.Root>
    {/if}

    {#if binding.clearable && binding.control.data !== undefined}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-9 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        title={message('control.clearValue')}
        aria-label={message('control.clearValue')}
      >
        <XIcon />
      </Button>
    {/if}
  </div>
  <InvalidChoiceValue {controlId} value={invalidValue} />
</ControlWrapper>
