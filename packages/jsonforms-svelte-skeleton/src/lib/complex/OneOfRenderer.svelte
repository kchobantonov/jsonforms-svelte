<script lang="ts">
  import {
    CombinatorBranch,
    dataPathSegments,
    scopeDataSegments,
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
  import {
    Combobox,
    Dialog,
    Portal,
    Tooltip,
    useListCollection,
  } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlertIcon as ExclamationCircleOutline, XIcon } from '@lucide/svelte';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import { untrack, onMount, type ComponentProps } from 'svelte';
  import isEqual from 'lodash/isEqual';
  import cloneDeep from 'lodash/cloneDeep';
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
  let clearFocused = $state(false);
  let clearHovered = $state(false);
  let clearDismissed = $state(false);
  const clearTooltipOpen = $derived((clearFocused || clearHovered) && !clearDismissed);
  const dismissClearTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') clearDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissClearTooltip, true));
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);

  const binding = useCombinatorTranslations(useSkeletonControl(useJsonFormsOneOfControl(props)));
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
      controlPathSegments,
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

  const getRootNode = getPortalRootNodeGetter();

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

  const discriminatorIndex = $derived(
    discriminatorBranch(
      binding.control.schema,
      binding.control.rootSchema,
      'oneOf',
      binding.control.data,
    ),
  );
  const fittingIndex = $derived(discriminatorIndex ?? binding.control.indexOfFittingSchema);
  let userChosen = $state(false);
  let chosenIndex = $state<number | null>(
    untrack(() => initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length)),
  );
  $effect(() => {
    const next = initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length);
    if (userChosen && discriminatorIndex !== undefined && discriminatorIndex === chosenIndex)
      userChosen = false;
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
    const initialData = cloneDeep(binding.control.data);
    const sameTarget = () =>
      path === binding.control.path &&
      isEqual(schema, binding.control.schema) &&
      isEqual(rootSchema, binding.control.rootSchema) &&
      binding.control.visible &&
      binding.control.enabled &&
      !binding.control.readonly;
    let flushedData: unknown;
    preparingBranchChange = true;
    try {
      if (
        !(await prepareAction(
          () => sameTarget() && isEqual(binding.control.data, initialData),
          () => {
            flushedData = cloneDeep(binding.control.data);
            return () => sameTarget() && isEqual(binding.control.data, flushedData);
          },
        )) ||
        !sameTarget() ||
        !isEqual(binding.control.data, flushedData) ||
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

  function handleSelectValueChange(details: { value: string[] }) {
    requestBranchChange(details.value[0] ? Number(details.value[0]) : null);
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

  const collection = $derived(
    useListCollection({
      items: selectItems,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.value,
    }),
  );
  let selectorOpen = $state(false);
  function focusSelectorTrigger() {
    const root = getRootNode();
    if ('querySelector' in root) {
      root
        .querySelector<HTMLButtonElement>(
          `#${CSS.escape(`${binding.control.id}-selector-trigger`)}`,
        )
        ?.focus();
    }
  }

  const comboboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox');

    return {
      ...skeletonProps,
      collection,
      value:
        selectedIndex === null || selectedIndex === undefined ? [] : [selectedIndex.toString()],
      allowCustomValue: false,
      openOnClick: true,
      open: selectorOpen,
      positioning: { fitViewport: true },
      closeOnSelect: true,
      selectionBehavior: 'replace' as const,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!selectorErrors,
      required: binding.control.required,
      placeholder: binding.appliedOptions.placeholder ?? message('control.selectOption'),
      onOpenChange: (details: { open: boolean; reason?: string }) => {
        if (typeof skeletonProps.onOpenChange === 'function') skeletonProps.onOpenChange(details);
        selectorOpen = details.open;
      },
      onValueChange: handleSelectValueChange,
    };
  });

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox.Input');
    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, skeletonProps.class, 'w-full pe-20'),
      autofocus: binding.initialFocus,
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

<svelte:window
  onkeydowncapture={(event) => {
    if (event.key !== 'Escape' || !selectorOpen) return;
    event.preventDefault();
    event.stopPropagation();
    selectorOpen = false;
    focusSelectorTrigger();
  }}
/>

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
            <Combobox
              translations={{
                triggerLabel: message('control.selectOption'),
                clearTriggerLabel: message('oneOf.clear'),
              }}
              {...comboboxProps}
            >
              <Combobox.Control class="group relative w-full">
                <Combobox.Input {...inputProps} />
                {#if binding.clearable && selectedIndex !== null}
                  <Tooltip
                    open={clearTooltipOpen}
                    openDelay={0}
                    {getRootNode}
                    positioning={{ placement: 'top', strategy: 'fixed' }}
                  >
                    <Tooltip.Trigger>
                      {#snippet element(triggerProps)}
                        <Combobox.ClearTrigger
                          {...triggerProps as Partial<ComponentProps<typeof Combobox.ClearTrigger>>}
                          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
                          style="position: absolute; inset-block: 0; inset-inline-end: 2.25rem; margin-block: auto;"
                          onmousedown={(event: MouseEvent) => event.preventDefault()}
                          onclick={handleClear}
                          disabled={!binding.control.enabled}
                          aria-label={message('oneOf.clear')}
                          title={message('oneOf.clear')}
                          onfocus={() => {
                            clearFocused = true;
                            clearDismissed = false;
                            window.addEventListener('keydown', dismissClearTooltip, true);
                          }}
                          onblur={() => {
                            clearFocused = false;
                            window.removeEventListener('keydown', dismissClearTooltip, true);
                          }}
                          onpointerenter={() => {
                            clearHovered = true;
                            clearDismissed = false;
                          }}
                          onpointerleave={() => (clearHovered = false)}
                        >
                          <XIcon class="size-4 shrink-0" />
                        </Combobox.ClearTrigger>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Portal target={getPortalTarget()}>
                      <Tooltip.Context>
                        {#snippet children(tooltip)}
                          <div {...tooltip().getPositionerProps()}>
                            <Tooltip.Content
                              class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                              >{message('oneOf.clear')}</Tooltip.Content
                            >
                          </div>
                        {/snippet}
                      </Tooltip.Context>
                    </Portal>
                  </Tooltip>
                {/if}
                <Combobox.Trigger id={`${binding.control.id}-selector-trigger`} />
              </Combobox.Control>

              <Portal target={getPortalTarget()}>
                <Combobox.Positioner>
                  <Combobox.Content
                    class="max-h-[min(20rem,var(--available-height,20rem),calc(100dvh-2rem))] overflow-y-auto"
                  >
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
        {/if}
      </ControlWrapper>

      {#if selectedIndex !== undefined && selectedIndex !== null}
        <CombinatorBranch
          validationOptions={binding.control.uischema.options}
          schema={oneOfRenderInfos[selectedIndex].schema}
          uischema={oneOfRenderInfos[selectedIndex].uischema}
          path={binding.control.path}
          pathSegments={controlPathSegments}
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

      <Dialog open={dialog} onOpenChange={(e) => (dialog = e.open)} {getRootNode}>
        <Portal target={getPortalTarget()}>
          <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
          <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Content
              class="card preset-filled-surface-50-950 w-full max-w-sm p-6"
              onkeydown={handleKeydown}
            >
              <div class="text-center">
                <ExclamationCircleOutline
                  class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
                />
                <Dialog.Title class="text-lg font-semibold">
                  {message('confirm.branchChange.title')}
                </Dialog.Title>
                <p class="mb-5 text-center text-sm">
                  {message('confirm.branchChange.message')}
                </p>
                <div class="flex justify-center gap-4">
                  <button type="button" class="btn preset-outlined" onclick={cancel}>
                    {message('confirm.decline')}
                  </button>
                  <button type="button" class="btn preset-filled-error-500" onclick={confirm}>
                    {message('confirm.accept')}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog>
    </div>
  {/if}
{/if}
