<script lang="ts">
  import {
    CombinatorBranch,
    usePendingControlAction,
    branchChangeData,
    discriminatorBranch,
    initialOneOfBranch,
    missingDiscriminatorError,
    clearedBranchValue,
    isArrayItemPath,
    useJsonForms,
    discardedByBranchChange,
    resolveConfirmationPolicy,
    confirmationRequired,
    ScalarCompositionControl,
    scalarCompositionSchema,
    useJsonFormsOneOfControl,
    useTranslator,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    createCombinatorRenderInfos,
    createDefaultValue,
    type CombinatorSubSchemaRenderInfo,
    type JsonSchema,
  } from '@jsonforms/core';
  import { Button, Heading, Modal, P } from 'flowbite-svelte';
  import Select from '../controls/components/LocalizedSelect.svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import { untrack } from 'svelte';
  import isEqual from 'lodash/isEqual';
  import cloneDeep from 'lodash/cloneDeep';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useFlowbiteControl(useJsonFormsOneOfControl(props)));
  const scalarSchema = $derived(
    scalarCompositionSchema(binding.control.schema, binding.control.rootSchema),
  );
  const scalarUISchema = $derived({
    ...binding.control.uischema,
    scope: '#',
    label: binding.control.uischema.label ?? binding.control.label,
  });

  const form = useJsonForms();
  const t = useTranslator();
  const message = useRendererMessages();
  const selectionError = $derived(
    missingDiscriminatorError(
      binding.control.schema,
      binding.control.rootSchema,
      binding.control.path,
      [
        ...(form.core?.validationMode === 'NoValidation' ||
        form.core?.validationMode === 'ValidateAndHide'
          ? []
          : (form.core?.errors ?? [])),
        ...(form.core?.additionalErrors ?? []),
      ],
    )
      ? message('oneOf.chooseKind')
      : '',
  );
  const selectorErrors = $derived(
    [binding.controlWrapper.errors, selectionError].filter(Boolean).join('\n'),
  );

  const oneOfRenderInfos = $derived.by(
    (): (CombinatorSubSchemaRenderInfo & {
      index: number;
    })[] => {
      const result = createCombinatorRenderInfos(
        binding.control.schema.oneOf ?? [],
        binding.control.rootSchema,
        'oneOf',
        binding.control.uischema,
        binding.control.path,
        binding.control.uischemas,
      );

      return result.map((info, index) => ({ ...info, index: index }));
    },
  );

  const fittingIndex = $derived(
    discriminatorBranch(
      binding.control.schema,
      binding.control.rootSchema,
      'oneOf',
      binding.control.data,
    ) ?? binding.control.indexOfFittingSchema,
  );
  let userChosen = $state(false);
  let chosenIndex = $state<number | null>(
    untrack(() => initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length)),
  );
  $effect(() => {
    const next = initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length);
    if (
      next === null &&
      (!userChosen || binding.control.data === undefined || chosenIndex === null)
    ) {
      userChosen = false;
      chosenIndex = null;
      dialog = false;
    } else if (
      (!userChosen && fittingIndex !== undefined && fittingIndex >= 0) ||
      (chosenIndex !== null && chosenIndex >= oneOfRenderInfos.length)
    ) {
      chosenIndex = next;
    }
  });

  const selectedIndex = $derived(oneOfRenderInfos.length === 1 ? 0 : chosenIndex);

  const prepareAction = usePendingControlAction();
  let preparingBranchChange = false;
  let pendingTarget = $state.raw<{
    data: unknown;
    schema: unknown;
    rootSchema: unknown;
    path: string;
  }>();
  const currentTarget = () =>
    pendingTarget !== undefined &&
    binding.control.enabled &&
    !binding.control.readonly &&
    binding.control.visible &&
    pendingTarget.path === binding.control.path &&
    isEqual(pendingTarget.schema, binding.control.schema) &&
    isEqual(pendingTarget.rootSchema, binding.control.rootSchema) &&
    isEqual(pendingTarget.data, binding.control.data);
  $effect(() => {
    if (dialog && !currentTarget()) dialog = false;
  });

  let newSelectedIndex = $state<number | null>(null);
  let dialog = $state(false);

  const selectItems = $derived(
    oneOfRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(
        typeof (item.schema as { i18n?: string }).i18n === 'string'
          ? `${(item.schema as { i18n: string }).i18n}.label`
          : item.label,
        item.label,
      ),
    })),
  );

  function openNewTab(newIndex: number | null): void {
    untrack(() => {
      if (!binding.control.enabled || binding.control.readonly) return;
      if (newIndex !== null && (!Number.isInteger(newIndex) || !oneOfRenderInfos[newIndex])) return;
      const defaults =
        newIndex === null
          ? clearedBranchValue(
              isArrayItemPath(form.core?.data, binding.control.path),
              oneOfRenderInfos.map((info) => info.schema),
            )
          : createDefaultValue(oneOfRenderInfos[newIndex].schema, binding.control.rootSchema);
      binding.handleChange(
        binding.control.path,
        branchChangeData(binding.control.data, defaults, binding.control.schema),
      );
      chosenIndex = newIndex;
    });
  }

  async function requestBranchChange(next: number | null) {
    if (preparingBranchChange || !binding.control.enabled || binding.control.readonly) return;
    const path = binding.control.path;
    const schema = binding.control.schema;
    const rootSchema = binding.control.rootSchema;
    preparingBranchChange = true;
    try {
      if (
        !(await prepareAction()) ||
        path !== binding.control.path ||
        !isEqual(schema, binding.control.schema) ||
        !isEqual(rootSchema, binding.control.rootSchema) ||
        !binding.control.visible ||
        !binding.control.enabled ||
        binding.control.readonly ||
        next === selectedIndex
      )
        return;
      if (next !== null && (!Number.isInteger(next) || !oneOfRenderInfos[next])) return;
      newSelectedIndex = next;
      const policy = resolveConfirmationPolicy({
        catalogId: 'oneOf',
        operation: 'branchChange',
        config: binding.control.config,
        options: binding.control.uischema.options,
      });
      const branchSchema = {
        ...binding.control.schema,
        oneOf: oneOfRenderInfos.map((info) => info.schema),
      } as JsonSchema;
      if (
        confirmationRequired(policy, [
          discardedByBranchChange(binding.control.data, branchSchema, policy === 'complex'),
        ])
      ) {
        pendingTarget = {
          data: cloneDeep(binding.control.data),
          schema: cloneDeep(binding.control.schema),
          rootSchema: cloneDeep(binding.control.rootSchema),
          path: binding.control.path,
        };
        dialog = true;
      } else {
        userChosen = true;
        openNewTab(next);
      }
    } finally {
      preparingBranchChange = false;
    }
  }

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const next = target.value ? Number(target.value) : null;
    target.value = selectedIndex == null ? '' : String(selectedIndex);
    requestBranchChange(next);
  }
  function handleClear() {
    requestBranchChange(null);
  }

  function confirm(): void {
    const valid = dialog && currentTarget();
    dialog = false;
    pendingTarget = undefined;
    if (valid) {
      userChosen = true;
      openNewTab(newSelectedIndex);
    }
  }

  function cancel(): void {
    pendingTarget = undefined;
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
      onClear: handleClear,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!selectorErrors,
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
  const modalProps = $derived(binding.flowbiteProps('Modal'));
</script>

{#if binding.control.visible}
  {#if scalarSchema}
    <ScalarCompositionControl
      schema={scalarSchema}
      rootSchema={binding.control.rootSchema}
      uischema={scalarUISchema}
      path={binding.control.path}
      enabled={binding.control.enabled}
      renderers={binding.control.renderers}
      cells={binding.control.cells}
    />
  {:else}
    <div>
      <CombinatorProperties
        schema={binding.control.schema}
        combinatorKeyword="oneOf"
        path={binding.control.path}
        rootSchema={binding.control.rootSchema}
      />

      <ControlWrapper {...binding.controlWrapper} errors={selectorErrors}>
        {#if oneOfRenderInfos.length === 1}
          <span>{selectItems[0]?.name}</span>
        {:else}
          {#key dialog}
            <Select {...inputprops}></Select>
          {/key}
        {/if}
      </ControlWrapper>

      {#if selectedIndex !== undefined && selectedIndex !== null}
        <CombinatorBranch
          validationOptions={binding.control.uischema.options}
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
        <AdditionalProperties
          input={binding}
          disallowedPropertyNames={oneOfReservedPropertyNames}
        />
      {/if}

      <Modal
        bind:open={
          () => dialog,
          (open) => {
            if (!open) cancel();
          }
        }
        size="sm"
        autoclose={false}
        outsideclose
        onkeydown={handleKeydown}
        {...modalProps}
      >
        <div class="text-center">
          <ExclamationCircleOutline
            class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
          />
          <Heading tag="h3" class="text-lg font-semibold">
            {binding.control.translations?.clearDialogTitle ??
              message('combinator.clearDialogTitle')}
          </Heading>
          <P class="mb-5 text-center text-sm">
            {binding.control.translations?.clearDialogMessage ??
              message('combinator.clearDialogMessage')}
          </P>
          <div class="flex justify-center gap-4">
            <Button color="alternative" onclick={cancel}>
              {binding.control.translations?.clearDialogDecline ??
                message('combinator.clearDialogDecline')}
            </Button>
            <Button color="red" onclick={confirm}>
              {binding.control.translations?.clearDialogAccept ??
                message('combinator.clearDialogAccept')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  {/if}
{/if}
