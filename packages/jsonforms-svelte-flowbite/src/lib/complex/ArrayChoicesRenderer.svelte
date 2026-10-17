<script lang="ts">
  import {
    useArrayChoices,
    useRendererMessages,
    sameChoice,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, Button, MultiSelect } from 'flowbite-svelte';
  import { CloseOutline as XIcon, PlusOutline as PlusIcon } from 'flowbite-svelte-icons';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';
  const props: ControlProps = $props();
  const model = useArrayChoices(props);
  const binding = useFlowbiteControl(model.binding);
  const message = useRendererMessages();
  let draft = $state('');
  let search = $state('');
  const chips = $derived(props.uischema.options?.variant === 'chips');
  function add() {
    if (model.add(draft)) draft = '';
  }
  const items = $derived(
    model.nativeChoices
      .filter(
        (choice) =>
          model.selectedIds.includes(choice.id) ||
          choice.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      )
      .map((choice) => ({
        value: choice.id,
        name: choice.label,
        disabled: model.selectedIds.includes(choice.id) ? !model.canRemove : !model.canAdd,
      })),
  );
</script>

{#snippet pills()}
  {#each model.values as value, index (index)}
    <span
      class="inline-flex max-w-full items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100"
    >
      <span class="min-w-0 truncate" title={model.label(value)}>{model.label(value)}</span>
      <Button
        type="button"
        color="alternative"
        size="xs"
        class="size-4 shrink-0 p-0"
        disabled={!model.canRemove}
        aria-label={message('arrayChoices.remove', { label: model.label(value) })}
        onclick={() => model.remove(index)}><XIcon class="size-3" /></Button
      >
    </span>
  {/each}
{/snippet}

<ControlWrapper {...binding.controlWrapper}>
  <div onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {#if chips}
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        {@render pills()}
        <Input
          id={`${binding.control.id}-input`}
          class="min-w-40 flex-1"
          bind:value={draft}
          list={model.finite ? `${binding.control.id}-choices` : undefined}
          disabled={!model.canAdd}
          aria-invalid={!!binding.control.errors}
          placeholder={binding.appliedOptions.placeholder ?? message('chips.addPlaceholder')}
          onkeydown={(event) => {
            if (event.isComposing) return;
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            } else if (event.key === 'Backspace' && draft === '') {
              event.preventDefault();
              model.remove(model.values.length - 1);
            }
          }}
        />
        {#if model.finite}
          <datalist id={`${binding.control.id}-choices`}>
            {#each model.binding.control.options ?? [] as choice, index (index)}
              <option value={String(choice.value)}>{choice.label}</option>
            {/each}
          </datalist>
        {/if}
        <Button
          type="button"
          color="alternative"
          size="sm"
          disabled={!model.canAdd || !draft}
          aria-label={message('arrayChoices.add')}
          onclick={add}><PlusIcon class="size-4" /></Button
        >
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <Input
          aria-label={message('arrayChoices.search')}
          bind:value={search}
          disabled={model.disabled}
        />
        <MultiSelect
          id={`${binding.control.id}-input`}
          {items}
          bind:value={() => model.selectedIds, model.select}
          disabled={model.disabled}
          placeholder={binding.appliedOptions.placeholder ?? binding.control.label}
          aria-label={binding.control.label}
          aria-invalid={!!binding.control.errors}
          classes={{ close: 'hidden' }}
        >
          {#snippet children({ item })}
            {#each model.values as value, index (index)}
              {#if sameChoice(value, model.nativeChoices.find((choice) => choice.id === item.value)?.value)}
                <span
                  class="inline-flex max-w-full items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700"
                >
                  <span class="min-w-0 truncate">{model.label(value)}</span>
                  <Button
                    type="button"
                    size="xs"
                    color="alternative"
                    class="size-4 p-0"
                    disabled={!model.canRemove}
                    aria-label={message('arrayChoices.remove', { label: model.label(value) })}
                    onkeydown={(event: KeyboardEvent) => event.stopPropagation()}
                    onclick={(event: MouseEvent) => {
                      event.stopPropagation();
                      model.remove(index);
                    }}><XIcon class="size-3" /></Button
                  >
                </span>
              {/if}
            {/each}
          {/snippet}
        </MultiSelect>
      </div>
    {/if}
  </div>
</ControlWrapper>
