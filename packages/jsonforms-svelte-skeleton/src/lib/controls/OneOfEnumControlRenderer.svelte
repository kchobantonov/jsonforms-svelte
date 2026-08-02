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

  const nativeSelectProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('select');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge('select w-full', binding.styles.control.input, skeletonProps.class),
      disabled: !binding.control.enabled,
      value: binding.control.data == null ? '' : String(binding.control.data),
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      onchange: (event: Event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        const option = binding.control.options.find(
          (candidate) => String(candidate.value) === value,
        );
        binding.onChange(option?.value ?? clearValue);
      },
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if binding.appliedOptions.nativeSelect === true}
    <select {...nativeSelectProps}>
      {#if binding.clearable || binding.appliedOptions.placeholder}
        <option value="">{binding.appliedOptions.placeholder ?? 'Select an option'}</option>
      {/if}
      {#each selectItems as item (item.value)}
        <option value={item.value}>{item.name}</option>
      {/each}
    </select>
  {:else}
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
  {/if}
</ControlWrapper>
