<script lang="ts">
  import { BranchChangeConfirmation } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TypeChoicePopup from './components/TypeChoicePopup.svelte';
  import {
    useJsonFormsOneOfControl,
    useOneOfSelection,
    type ControlProps,
    OneOfContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { CircleAlertIcon as ExclamationCircleOutline, XIcon } from '$lib/components/icons';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import LocalizedDialogContent from '../components/LocalizedDialogContent.svelte';
  import { getPortalTarget, useCombinatorTranslations, useShadcnControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useShadcnControl(useJsonFormsOneOfControl(props)));

  const selection = useOneOfSelection(props, binding);
  const { selectorErrors, selectedIndex, selectItems } = $derived(selection);
  const { message, requestBranchChange, confirm, cancel } = selection;

  function handleSelectValueChange(value: string) {
    requestBranchChange(value ? Number(value) : null);
  }

  const selectedValue = $derived(selectedIndex == null ? undefined : selectedIndex.toString());
  const selectedLabel = $derived(selectItems.find((item) => item.value === selectedValue)?.name);
</script>

<OneOfContent
  {binding}
  {selection}
  {ControlWrapper}
  wrapperProps={binding.controlWrapper}
  {AdditionalProperties}
>
  {#snippet selector()}
    <div class="group relative w-full">
      <Select.Root
        type="single"
        bind:value={() => selectedValue ?? '', handleSelectValueChange}
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
          aria-invalid={!!selectorErrors}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
        >
          <span
            class={selectedLabel ? 'min-w-0 truncate' : 'text-muted-foreground min-w-0 truncate'}
          >
            {selectedLabel ?? binding.appliedOptions.placeholder ?? message('control.selectOption')}
          </span>
        </Select.Trigger>
        <TypeChoicePopup items={selectItems} />
      </Select.Root>
      {#if binding.clearable && selectedIndex !== null}
        <TupleAction
          kind="add"
          label={message('oneOf.clear')}
          buttonVariant="ghost"
          buttonSize="icon-xs"
          buttonClass="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={selection.clear}
          disabled={!binding.control.enabled}
        >
          {#snippet icon()}<XIcon class="size-4 shrink-0" />{/snippet}
        </TupleAction>
      {/if}
    </div>
  {/snippet}
  {#snippet dialog()}
    <Dialog.Root bind:open={selection.dialog}>
      <LocalizedDialogContent
        portalProps={{ to: getPortalTarget() }}
        class="max-w-sm"
        closeLabel={message('dialog.close')}
        onkeydown={selection.handleDialogKeydown}
      >
        <BranchChangeConfirmation
          Icon={ExclamationCircleOutline}
          Title={Dialog.Title}
          {confirm}
          {cancel}
        >
          {#snippet button(accept, label, onclick)}<Button
              variant={accept ? 'destructive' : 'outline'}
              {onclick}>{label}</Button
            >{/snippet}
        </BranchChangeConfirmation>
      </LocalizedDialogContent>
    </Dialog.Root>
  {/snippet}
</OneOfContent>
