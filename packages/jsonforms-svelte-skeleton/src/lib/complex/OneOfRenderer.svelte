<script lang="ts">
  import { BranchChangeConfirmation } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TypeChoicePopup from './components/TypeChoicePopup.svelte';
  import { useTooltipTrigger } from '../util/tooltipTrigger.svelte';
  import TooltipContent from '../components/TooltipContent.svelte';
  import {
    useJsonFormsOneOfControl,
    useOneOfSelection,
    type ControlProps,
    OneOfContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    Combobox,
    Dialog,
    Portal,
    Tooltip,
    useListCollection,
  } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlertIcon as ExclamationCircleOutline, XIcon } from '@lucide/svelte';
  import { type ComponentProps } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  const props: ControlProps = $props();
  const clearTooltip = useTooltipTrigger();

  const binding = useCombinatorTranslations(useSkeletonControl(useJsonFormsOneOfControl(props)));

  const getRootNode = getPortalRootNodeGetter();

  const selection = useOneOfSelection(props, binding);
  const { selectorErrors, selectedIndex, selectItems } = $derived(selection);
  const { message, requestBranchChange, confirm, cancel } = selection;

  function handleSelectValueChange(details: { value: string[] }) {
    requestBranchChange(details.value[0] ? Number(details.value[0]) : null);
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

<OneOfContent
  {binding}
  {selection}
  {ControlWrapper}
  wrapperProps={binding.controlWrapper}
  {AdditionalProperties}
>
  {#snippet selector()}
    {#key selection.dialog}
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
              open={clearTooltip.open}
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
                    onclick={selection.clear}
                    disabled={!binding.control.enabled}
                    aria-label={message('oneOf.clear')}
                    title={message('oneOf.clear')}
                    {...clearTooltip.events}
                  >
                    <XIcon class="size-4 shrink-0" />
                  </Combobox.ClearTrigger>
                {/snippet}
              </Tooltip.Trigger>
              <TooltipContent target={getPortalTarget()}>{message('oneOf.clear')}</TooltipContent>
            </Tooltip>
          {/if}
          <Combobox.Trigger id={`${binding.control.id}-selector-trigger`} />
        </Combobox.Control>

        <TypeChoicePopup target={getPortalTarget()} items={selectItems} />
      </Combobox>
    {/key}
  {/snippet}
  {#snippet dialog()}
    <Dialog open={selection.dialog} onOpenChange={(e) => (selection.dialog = e.open)} {getRootNode}>
      <Portal target={getPortalTarget()}>
        <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
        <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Content
            class="card preset-filled-surface-50-950 w-full max-w-sm p-6"
            onkeydown={selection.handleDialogKeydown}
          >
            <BranchChangeConfirmation
              Icon={ExclamationCircleOutline}
              Title={Dialog.Title}
              {confirm}
              {cancel}
            >
              {#snippet button(accept, label, onclick)}<button
                  type="button"
                  class={accept ? 'btn preset-filled-error-500' : 'btn preset-outlined'}
                  {onclick}>{label}</button
                >{/snippet}
            </BranchChangeConfirmation>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog>
  {/snippet}
</OneOfContent>
