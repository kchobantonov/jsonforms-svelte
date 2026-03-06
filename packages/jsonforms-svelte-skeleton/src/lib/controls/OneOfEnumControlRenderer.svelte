<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { CheckIcon, ChevronsUpDownIcon, XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import {
    determineClearValue,
    getPortalRootNodeGetter,
    getPortalTarget,
    useSkeletonControl,
  } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const getRootNode = getPortalRootNodeGetter();

  const binding = useSkeletonControl(
    useJsonFormsOneOfEnumControl(props),
    (value) => (value === null ? clearValue : value),
    300,
  );

  const selectItems = $derived(
    binding.control.options.map((option) => ({
      value: String(option.value),
      name: option.label,
    })),
  );

  const collection = $derived(
    useListCollection({
      items: selectItems,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.value,
    }),
  );

  const comboboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox');

    return {
      ...skeletonProps,
      collection,
      value:
        binding.control.data === undefined ||
        binding.control.data === null ||
        binding.control.data === ''
          ? []
          : [String(binding.control.data)],
      allowCustomValue: false,
      closeOnSelect: true,
      selectionBehavior: 'replace' as const,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      required: binding.control.required,
      placeholder: binding.appliedOptions.placeholder ?? 'Select an option',
      onValueChange: (details: { value: string[] }) =>
        binding.onChange(details.value[0] ?? clearValue),
    };
  });

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox.Input');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, skeletonProps.class, 'w-full pe-20'),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Combobox {...comboboxProps}>
    <Combobox.Control class="group relative w-full">
      <Combobox.Input {...inputProps} />
      {#if binding.clearable && binding.control.data !== undefined && binding.control.data !== null && binding.control.data !== ''}
        <Combobox.ClearTrigger
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 2.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="size-4 shrink-0" />
        </Combobox.ClearTrigger>
      {/if}
      <Combobox.Trigger />
    </Combobox.Control>

    <Portal target={getPortalTarget()}>
      <Combobox.Positioner>
        <Combobox.Content>
          {#each selectItems as item (item.value)}
            <Combobox.Item {item}>
              <Combobox.ItemText>{item.name}</Combobox.ItemText>
              <Combobox.ItemIndicator />
            </Combobox.Item>
          {/each}
        </Combobox.Content>
      </Combobox.Positioner>
    </Portal>
  </Combobox>
</ControlWrapper>
