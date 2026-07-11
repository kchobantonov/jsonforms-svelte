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
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { CircleAlertIcon as ExclamationCircleOutline, XIcon } from '@lucide/svelte';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { getPortalTarget, useCombinatorTranslations, useShadcnControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useShadcnControl(useJsonFormsOneOfControl(props)));
  const t = useTranslator();

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

  function handleSelectValueChange(value: string) {
    untrack(() => {
      newSelectedIndex = value ? parseInt(value) : null;

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

  const selectedValue = $derived(selectedIndex == null ? undefined : selectedIndex.toString());
  const selectedLabel = $derived(selectItems.find((item) => item.value === selectedValue)?.name);

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
      combinatorKeyword="oneOf"
      path={binding.control.path}
      rootSchema={binding.control.rootSchema}
    />
    <ControlWrapper {...binding.controlWrapper}>
      <div class="group relative w-full">
        <Select.Root
          type="single"
          value={selectedValue}
          onValueChange={handleSelectValueChange}
          disabled={!binding.control.enabled}
          required={binding.control.required}
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
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
          >
            <span class={selectedLabel ? '' : 'text-muted-foreground'}>
              {selectedLabel ?? binding.appliedOptions.placeholder ?? 'Select an option'}
            </span>
          </Select.Trigger>
          <Select.Content portalProps={{ to: getPortalTarget() }}>
            {#each selectItems as item (item.value)}
              <Select.Item value={item.value} label={item.name}>{item.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if binding.clearable && selectedIndex !== null}
          <Button
            variant="ghost"
            size="icon-xs"
            class="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            onmousedown={(event: MouseEvent) => event.preventDefault()}
            onclick={handleClear}
            disabled={!binding.control.enabled}
            aria-label="Clear value"
          >
            <XIcon class="size-4 shrink-0" />
          </Button>
        {/if}
      </div>
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
      <AdditionalProperties input={binding} disallowedPropertyNames={oneOfReservedPropertyNames} />
    {/if}

    <Dialog.Root bind:open={dialog}>
      <Dialog.Content
        portalProps={{ to: getPortalTarget() }}
        class="max-w-sm"
        onkeydown={handleKeydown}
      >
        <div class="text-center">
          <ExclamationCircleOutline
            class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
          />
          <Dialog.Title class="text-lg font-semibold">
            {binding.control.translations?.clearDialogTitle || 'Clear data?'}
          </Dialog.Title>
          <p class="mb-5 text-center text-sm">
            {binding.control.translations?.clearDialogMessage ||
              'Changing the selection will clear the current data. Are you sure you want to continue?'}
          </p>
          <div class="flex justify-center gap-4">
            <Button variant="outline" onclick={cancel}>
              {binding.control.translations?.clearDialogDecline || 'Cancel'}
            </Button>
            <Button variant="destructive" onclick={confirm}>
              {binding.control.translations?.clearDialogAccept || 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  </div>
{/if}
