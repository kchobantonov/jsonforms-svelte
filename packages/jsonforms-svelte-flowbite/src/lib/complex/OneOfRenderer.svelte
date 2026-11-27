<script lang="ts">
  import {
    useJsonFormsOneOfControl,
    useOneOfSelection,
    type ControlProps,
    OneOfContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Heading, Modal, P } from 'flowbite-svelte';
  import Select from '../controls/components/LocalizedSelect.svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { selectProps } from '../util/selectProps';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  const props: ControlProps = $props();

  const binding = useCombinatorTranslations(useFlowbiteControl(useJsonFormsOneOfControl(props)));

  const selection = useOneOfSelection(props, binding);
  const { selectorErrors, selectedIndex, selectItems } = $derived(selection);
  const { message, requestBranchChange, confirm, cancel } = selection;

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const next = target.value ? Number(target.value) : null;
    target.value = selectedIndex == null ? '' : String(selectedIndex);
    requestBranchChange(next);
  }

  const inputprops = $derived.by(() => {
    return {
      ...selectProps(binding),
      items: selectItems,
      value: selectedIndex?.toString() ?? '',
      onchange: handleSelectChange,
      onClear: selection.clear,
      'aria-invalid': !!selectorErrors,
    };
  });

  const modalProps = $derived(binding.flowbiteProps('Modal'));
</script>

<OneOfContent
  {binding}
  {selection}
  {ControlWrapper}
  wrapperProps={binding.controlWrapper}
  {AdditionalProperties}
>
  {#snippet selector()}
    {#key selection.dialog}
      <Select {...inputprops} clearLabel={message('oneOf.clear')}></Select>
    {/key}
  {/snippet}
  {#snippet dialog()}
    <Modal
      bind:open={
        () => selection.dialog,
        (open) => {
          if (!open) cancel();
        }
      }
      size="sm"
      autoclose={false}
      outsideclose
      onkeydown={selection.handleDialogKeydown}
      {...modalProps}
    >
      <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
        <Heading tag="h3" class="text-lg font-semibold">
          {message('confirm.branchChange.title')}
        </Heading>
        <P class="mb-5 text-center text-sm">
          {message('confirm.branchChange.message')}
        </P>
        <div class="flex justify-center gap-4">
          <Button color="alternative" onclick={cancel}>
            {message('confirm.decline')}
          </Button>
          <Button color="red" onclick={confirm}>
            {message('confirm.accept')}
          </Button>
        </div>
      </div>
    </Modal>
  {/snippet}
</OneOfContent>
