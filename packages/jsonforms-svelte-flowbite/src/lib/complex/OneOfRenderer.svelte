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
  import { Button, Heading, Modal, P, Select } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import { untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useFlowbiteControl(useJsonFormsOneOfControl(props)));
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
        : !isEmpty(binding.control.data)
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

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    untrack(() => {
      newSelectedIndex = target.value ? parseInt(target.value) : null;

      const currentData =
        binding.control.data && reservedPropertyNames.length > 0
          ? { ...binding.control.data }
          : binding.control.data;

      if (currentData) {
        for (const name of reservedPropertyNames) {
          delete currentData[name];
        }
      }
      if (isEmpty(currentData)) {
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
      if (isEmpty(currentData)) {
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

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge('w-full', binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      items: selectItems,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: selectedIndex?.toString() ?? '',
      clearable: binding.clearable,
      onchange: handleSelectChange,
      clearableOnClick: handleClear,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
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
        <Select {...inputprops}></Select>
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

    <Modal open={dialog} size="sm" autoclose={false} outsideclose onkeydown={handleKeydown}>
      <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <Heading tag="h3" class="text-lg font-semibold">
          {binding.control.translations?.clearDialogTitle || 'Clear data?'}
        </Heading>
        <P class="mb-5 text-center text-sm">
          {binding.control.translations?.clearDialogMessage ||
            'Changing the selection will clear the current data. Are you sure you want to continue?'}
        </P>
        <div class="flex justify-center gap-4">
          <Button color="alternative" onclick={cancel}>
            {binding.control.translations?.clearDialogDecline || 'Cancel'}
          </Button>
          <Button color="red" onclick={confirm}>
            {binding.control.translations?.clearDialogAccept || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
{/if}
