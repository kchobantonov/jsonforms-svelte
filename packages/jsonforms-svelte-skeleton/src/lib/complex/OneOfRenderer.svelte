<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsOneOfControl,
    useTranslator,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    createCombinatorRenderInfos,
    createDefaultValue,
    type CombinatorSubSchemaRenderInfo,
  } from '@jsonforms/core';
  import { Combobox, Dialog, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlertIcon as ExclamationCircleOutline, XIcon } from '@lucide/svelte';
  import isObject from 'lodash/isObject';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useSkeletonControl(useJsonFormsOneOfControl(props)));
  const t = useTranslator();
  const getRootNode = getPortalRootNodeGetter();

  const oneOfRenderInfos = $derived.by(
    (): (CombinatorSubSchemaRenderInfo & {
      index: number;
    })[] => {
      const result = createCombinatorRenderInfos(
        binding.control.schema.oneOf!,
        binding.control.rootSchema,
        'oneOf',
        binding.control.uischema,
        binding.control.path,
        binding.control.uischemas,
      );

      return result.map((info, index) => ({ ...info, index: index }));
    },
  );

  let selectedIndex = $state(
    untrack(() =>
      binding.control.indexOfFittingSchema != null &&
      binding.control.indexOfFittingSchema != undefined // use the fitting schema if found
        ? binding.control.indexOfFittingSchema
        : binding.control.data !== undefined
          ? 0 // uses the first schema and report errors if not empty
          : null,
    ),
  );

  let newSelectedIndex = $state<number | null>(null);
  let dialog = $state(false);
  const reservedPropertyNames = $derived(Object.keys(binding.control.schema.properties || {}));

  const selectItems = $derived(
    oneOfRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(item.label, item.label),
    })),
  );

  function openNewTab(newIndex: number | null): void {
    untrack(() => {
      let newValue =
        newIndex != null
          ? createDefaultValue(oneOfRenderInfos[newIndex].schema, binding.control.rootSchema)
          : undefined;
      if (reservedPropertyNames.length > 0) {
        const currentData = binding.control.data;
        const reservedProps =
          currentData && typeof currentData === 'object'
            ? reservedPropertyNames.reduce(
                (acc, key) => {
                  if (key in currentData) {
                    acc[key] = currentData[key];
                  }
                  return acc;
                },
                {} as Record<string, unknown>,
              )
            : {};
        newValue = { ...(newValue ?? {}), ...reservedProps };
      }

      binding.handleChange(binding.control.path, newValue);

      selectedIndex = newIndex;
    });
  }

  function handleSelectValueChange(details: { value: string[] }) {
    untrack(() => {
      newSelectedIndex = details.value[0] ? parseInt(details.value[0]) : null;

      const currentData =
        binding.control.data && reservedPropertyNames.length > 0
          ? { ...binding.control.data }
          : binding.control.data;

      if (currentData) {
        for (const name of reservedPropertyNames) {
          delete currentData[name];
        }
      }
      if (currentData === undefined) {
        openNewTab(newSelectedIndex);
      } else {
        dialog = true;
      }
    });
  }

  function handleClear() {
    untrack(() => {
      newSelectedIndex = null;

      const currentData =
        binding.control.data && reservedPropertyNames.length > 0
          ? { ...binding.control.data }
          : binding.control.data;

      if (currentData) {
        for (const name of reservedPropertyNames) {
          delete currentData[name];
        }
      }
      if (currentData === undefined) {
        openNewTab(newSelectedIndex);
      } else {
        dialog = true;
      }
    });
  }

  function confirm(): void {
    openNewTab(newSelectedIndex);
    dialog = false;
  }

  function cancel(): void {
    dialog = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        cancel();
        break;
    }
  }

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
      value: selectedIndex === null || selectedIndex === undefined ? [] : [selectedIndex.toString()],
      allowCustomValue: false,
      closeOnSelect: true,
      selectionBehavior: 'replace' as const,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      required: binding.control.required,
      placeholder: binding.appliedOptions.placeholder ?? 'Select an option',
      onValueChange: handleSelectValueChange,
    };
  });

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox.Input');
    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'w-full pe-20',
      ),
      autofocus: binding.appliedOptions.focus,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
    };
  });

  const hasAdditionalProperties = $derived(
    binding.control.schema.additionalProperties === true ||
      !isEmpty(binding.control.schema.patternProperties) ||
      isObject(binding.control.schema.additionalProperties),
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        binding.control.schema.additionalProperties === undefined),
  );

  const hasOneOfAdditionalProperties = $derived(
    selectedIndex !== null &&
      selectedIndex !== undefined &&
      (oneOfRenderInfos[selectedIndex].schema.additionalProperties === true ||
        !isEmpty(oneOfRenderInfos[selectedIndex].schema.patternProperties) ||
        isObject(oneOfRenderInfos[selectedIndex].schema.additionalProperties)),
  );

  const showOneOfAdditionalProperties = $derived(
    hasOneOfAdditionalProperties ||
      (selectedIndex !== null &&
        selectedIndex !== undefined &&
        binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        oneOfRenderInfos[selectedIndex].schema.additionalProperties === undefined),
  );

  const oneOfReservedPropertyNames = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? Object.keys(oneOfRenderInfos[selectedIndex].schema.properties || {})
      : [],
  );
</script>

{#if binding.control.visible}
  <div>
    <CombinatorProperties
      schema={binding.control.schema}
      combinatorKeyword={'oneOf'}
      path={binding.control.path}
      rootSchema={binding.control.rootSchema}
    />

    <ControlWrapper {...binding.controlWrapper}>
      {#key dialog}
        <Combobox {...comboboxProps}>
          <Combobox.Control class="group relative w-full">
            <Combobox.Input {...inputProps} />
            {#if binding.clearable && selectedIndex !== null}
              <Combobox.ClearTrigger
                class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
                style="position: absolute; inset-block: 0; inset-inline-end: 2.25rem; margin-block: auto;"
                onmousedown={(event: MouseEvent) => event.preventDefault()}
                onclick={handleClear}
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
      {/key}
    </ControlWrapper>

    {#if selectedIndex !== undefined && selectedIndex !== null}
      <DispatchRenderer
        schema={oneOfRenderInfos[selectedIndex].schema}
        uischema={oneOfRenderInfos[selectedIndex].uischema}
        path={binding.control.path}
        renderers={binding.control.renderers}
        cells={binding.control.cells}
        enabled={binding.control.enabled}
      />
      {#if showOneOfAdditionalProperties && !showAdditionalProperties}
        <AdditionalProperties
          input={binding}
          disallowedPropertyNames={oneOfReservedPropertyNames}
        />
      {/if}
    {/if}

    {#if showAdditionalProperties}
      <AdditionalProperties input={binding} disallowedPropertyNames={oneOfReservedPropertyNames}/>
    {/if}

    <Dialog open={dialog} onOpenChange={(e) => (dialog = e.open)} getRootNode={getRootNode}>
      <Portal target={getPortalTarget()}>
        <Dialog.Backdrop class="fixed inset-0 bg-surface-950/40" />
        <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Content
            class="card preset-filled-surface-50-950 w-full max-w-sm p-6"
            onkeydown={handleKeydown}
          >
      <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <Dialog.Title class="text-lg font-semibold">
          {binding.control.translations?.clearDialogTitle || 'Clear data?'}
        </Dialog.Title>
        <p class="mb-5 text-center text-sm">
          {binding.control.translations?.clearDialogMessage ||
            'Changing the selection will clear the current data. Are you sure you want to continue?'}
        </p>
        <div class="flex justify-center gap-4">
          <button type="button" class="btn preset-outlined" onclick={cancel}>
            {binding.control.translations?.clearDialogDecline || 'Cancel'}
          </button>
          <button type="button" class="btn preset-filled-error-500" onclick={confirm}>
            {binding.control.translations?.clearDialogAccept || 'Confirm'}
          </button>
        </div>
      </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog>
  </div>
{/if}
