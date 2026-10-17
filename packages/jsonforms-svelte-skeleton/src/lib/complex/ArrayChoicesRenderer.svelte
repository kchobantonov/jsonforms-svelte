<script lang="ts">
  import {
    useArrayChoices,
    useRendererMessages,
    sameChoice,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Combobox, Portal, TagsInput, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { XIcon, PlusIcon } from '@lucide/svelte';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { getPortalRootNodeGetter, getPortalTarget, useSkeletonControl } from '../util';
  const props: ControlProps = $props();
  const model = useArrayChoices(props);
  const binding = useSkeletonControl(model.binding);
  const message = useRendererMessages();
  const getRootNode = getPortalRootNodeGetter();
  let draft = $state('');
  let search = $state('');
  const chips = $derived(props.uischema.options?.variant === 'chips');
  const nativeTags = $derived(
    chips &&
      !model.finite &&
      binding.control.schema.uniqueItems === true &&
      model.values.every((value) => typeof value === 'string') &&
      new Set(model.values).size === model.values.length,
  );
  const stringValues = $derived(
    model.values.filter((value): value is string => typeof value === 'string'),
  );
  function add() {
    if (model.add(draft)) draft = '';
  }
  function setTags(details: { value: string[] }) {
    if (details.value.length > model.values.length) model.add(draft);
    else {
      const index = model.values.findIndex(
        (value) => !details.value.some((next) => sameChoice(value, next)),
      );
      model.remove(index);
    }
  }
  const tagTranslations = $derived({
    clearTriggerLabel: message('control.clearValue'),
    deleteTagTriggerLabel: (value: string) => message('arrayChoices.remove', { label: value }),
    tagSelected: (value: string) => message('arrayChoices.selected', { label: value }),
    tagAdded: (value: string) => message('arrayChoices.added', { label: value }),
    tagsPasted: (values: string[]) => message('arrayChoices.pasted', { label: values.join(', ') }),
    tagEdited: (value: string) => message('arrayChoices.edited', { label: value }),
    tagUpdated: (value: string) => message('arrayChoices.updated', { label: value }),
    tagDeleted: (value: string) => message('arrayChoices.deleted', { label: value }),
    noTagsSelected: message('arrayChoices.noneSelected'),
    inputLabel: () => binding.control.label,
  });
  const items = $derived(
    model.nativeChoices.map((choice) => ({
      value: choice.id,
      name: choice.label,
      disabled: model.selectedIds.includes(choice.id) ? !model.canRemove : !model.canAdd,
    })),
  );
  const collection = $derived(
    useListCollection({
      items: items.filter(
        (item) =>
          model.selectedIds.includes(item.value) ||
          item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      ),
      itemToString: (item) => item.name,
      itemToValue: (item) => item.value,
    }),
  );
</script>

{#snippet pills()}
  {#each model.values as value, index (index)}
    <span
      class="preset-tonal inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-sm"
    >
      <span class="min-w-0 truncate" title={model.label(value)}>{model.label(value)}</span>
      <button
        type="button"
        class="btn-icon size-4 shrink-0 p-0"
        disabled={!model.canRemove}
        aria-label={message('arrayChoices.remove', { label: model.label(value) })}
        onclick={() => model.remove(index)}><XIcon class="size-3" /></button
      >
    </span>
  {/each}
{/snippet}

<ControlWrapper {...binding.controlWrapper}>
  <div onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {#if nativeTags}
      <TagsInput
        value={stringValues}
        inputValue={draft}
        onInputValueChange={(details) => (draft = details.inputValue)}
        onValueChange={setTags}
        validate={() => model.accepts(draft)}
        editable={false}
        addOnPaste={false}
        delimiter={/(?!)/}
        disabled={model.disabled}
        invalid={!!binding.control.errors}
        {getRootNode}
        ids={{ input: `${binding.control.id}-input` }}
        translations={tagTranslations}
      >
        <TagsInput.Control class="flex flex-wrap items-center gap-2">
          {#each stringValues as value, index (index)}
            <TagsInput.Item {value} {index} class="preset-tonal rounded-md px-2 py-0.5 text-sm">
              <TagsInput.ItemPreview class="flex items-center gap-1">
                <TagsInput.ItemText>{model.label(value)}</TagsInput.ItemText>
                <TagsInput.ItemDeleteTrigger
                  class="btn-icon size-4 p-0"
                  disabled={!model.canRemove}
                  aria-label={message('arrayChoices.remove', { label: model.label(value) })}
                  ><XIcon class="size-3" /></TagsInput.ItemDeleteTrigger
                >
              </TagsInput.ItemPreview>
            </TagsInput.Item>
          {/each}
          <TagsInput.Input
            onkeydowncapture={(event) => {
              if (
                event.key === 'Enter' &&
                !event.isComposing &&
                (!model.accepts(draft) || draft !== draft.trim())
              ) {
                event.preventDefault();
                event.stopPropagation();
                if (model.accepts(draft)) add();
              }
            }}
            class="input min-w-40 flex-1"
            disabled={!model.canAdd}
            placeholder={binding.appliedOptions.placeholder ?? message('chips.addPlaceholder')}
          />
          <button
            type="button"
            class="btn-icon preset-outlined"
            disabled={!model.accepts(draft)}
            aria-label={message('arrayChoices.add')}
            onclick={add}><PlusIcon class="size-4" /></button
          >
        </TagsInput.Control>
      </TagsInput>
    {:else if chips}
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        {@render pills()}
        <input
          id={`${binding.control.id}-input`}
          class="input min-w-40 flex-1"
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
        <button
          type="button"
          class="btn-icon preset-outlined"
          disabled={!model.canAdd || !draft}
          aria-label={message('arrayChoices.add')}
          onclick={add}><PlusIcon class="size-4" /></button
        >
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-1">{@render pills()}</div>
        <Combobox
          {collection}
          multiple
          value={model.selectedIds}
          onValueChange={(details) => model.select(details.value)}
          onInputValueChange={(details) => (search = details.inputValue)}
          {getRootNode}
          disabled={model.disabled}
          invalid={!!binding.control.errors}
          closeOnSelect={false}
          selectionBehavior="clear"
          placeholder={binding.appliedOptions.placeholder ?? message('control.selectOption')}
        >
          <Combobox.Control>
            <Combobox.Input
              id={`${binding.control.id}-input`}
              class="input w-full"
              aria-label={binding.control.label}
            />
            <Combobox.Trigger aria-label={binding.control.label} />
          </Combobox.Control>
          <Portal target={getPortalTarget()}
            ><Combobox.Positioner
              ><Combobox.Content>
                {#each collection.items as item (item.value)}
                  <Combobox.Item {item}
                    ><Combobox.ItemText>{item.name}</Combobox.ItemText><Combobox.ItemIndicator
                    /></Combobox.Item
                  >
                {/each}
              </Combobox.Content></Combobox.Positioner
            ></Portal
          >
        </Combobox>
      </div>
    {/if}
  </div>
</ControlWrapper>
