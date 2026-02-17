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
  import { tick, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();

  const input = useCombinatorTranslations(useFlowbiteControl(useJsonFormsOneOfControl(props)));
  const t = useTranslator();

  const oneOfRenderInfos = $derived.by(
    (): (CombinatorSubSchemaRenderInfo & {
      index: number;
    })[] => {
      const result = createCombinatorRenderInfos(
        input.control.schema.oneOf!,
        input.control.rootSchema,
        'oneOf',
        input.control.uischema,
        input.control.path,
        input.control.uischemas,
      );

      return result.map((info, index) => ({ ...info, index: index }));
    },
  );

  let selectedIndex = $state(
    untrack(() =>
      input.control.indexOfFittingSchema != null && input.control.indexOfFittingSchema != undefined // use the fitting schema if found
        ? input.control.indexOfFittingSchema
        : !isEmpty(input.control.data)
          ? 0 // uses the first schema and report errors if not empty
          : null,
    ),
  );

  let newSelectedIndex = $state<number | null>(null);
  let dialog = $state(false);

  const selectItems = $derived(
    oneOfRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(item.label, item.label),
    })),
  );

  function openNewTab(newIndex: number | null): void {
    untrack(() => {
      input.handleChange(
        input.control.path,
        newIndex != null
          ? createDefaultValue(oneOfRenderInfos[newIndex].schema, input.control.rootSchema)
          : undefined,
      );

      selectedIndex = newIndex;
    });
  }

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    untrack(() => {
      newSelectedIndex = target.value ? parseInt(target.value) : null;

      if (isEmpty(input.control.data)) {
        openNewTab(newSelectedIndex);
      } else {
        dialog = true;
      }
    });
  }

  function handleClear() {
    untrack(() => {
      newSelectedIndex = null;

      if (isEmpty(input.control.data)) {
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
    const flowbiteProps = input.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge('w-full', input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      items: selectItems,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      value: selectedIndex?.toString() ?? '',
      clearable: input.clearable,
      onchange: handleSelectChange,
      clearableOnClick: handleClear,
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
    };
  });
</script>

{#if input.control.visible}
  <div>
    <CombinatorProperties
      schema={input.control.schema}
      combinatorKeyword={'oneOf'}
      path={input.control.path}
      rootSchema={input.control.rootSchema}
    />

    <ControlWrapper {...input.controlWrapper}>
      {#key dialog}
        <Select {...inputprops}></Select>
      {/key}
    </ControlWrapper>

    {#if selectedIndex !== undefined && selectedIndex !== null}
      {#key selectedIndex}
        <DispatchRenderer
          schema={oneOfRenderInfos[selectedIndex].schema}
          uischema={oneOfRenderInfos[selectedIndex].uischema}
          path={input.control.path}
          renderers={input.control.renderers}
          cells={input.control.cells}
          enabled={input.control.enabled}
        />
      {/key}
    {/if}

    <Modal open={dialog} size="sm" autoclose={false} outsideclose onkeydown={handleKeydown}>
      <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <Heading tag="h3" class="text-lg font-semibold">
          {input.control.translations?.clearDialogTitle || 'Clear data?'}
        </Heading>
        <P class="mb-5 text-center text-sm">
          {input.control.translations?.clearDialogMessage ||
            'Changing the selection will clear the current data. Are you sure you want to continue?'}
        </P>
        <div class="flex justify-center gap-4">
          <Button color="alternative" onclick={cancel}>
            {input.control.translations?.clearDialogDecline || 'Cancel'}
          </Button>
          <Button color="red" onclick={confirm}>
            {input.control.translations?.clearDialogAccept || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
{/if}
