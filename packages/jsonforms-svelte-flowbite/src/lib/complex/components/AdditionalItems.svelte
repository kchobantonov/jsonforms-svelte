<script lang="ts">
  import { tick } from 'svelte';
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  import {
    arrayChildNotice,
    CollectionItem,
    useAdditionalItems,
    useRendererMessages,
    type AdditionalItemsProps,
  } from '@chobantonov/jsonforms-svelte';
  import CollectionPager from '../../components/CollectionPager.svelte';
  import Action from '../../components/TupleAction.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';
  const props: AdditionalItemsProps = $props();
  const items = useAdditionalItems(props);
  const message = useRendererMessages();
  const definition = $derived(props.definition);
  const renderItem = $derived(props.renderItem);
  let sectionElement = $state<HTMLElement>();
  async function revealFirstTailError() {
    const offset = items.firstInvalidTailOffset;
    if (offset === undefined) return;
    items.page.change(Math.floor(offset / items.page.size) + 1);
    await tick();
    const index = definition.prefix.length + offset;
    const row = sectionElement?.querySelector<HTMLElement>(`[data-additional-item="${index}"]`);
    row?.scrollIntoView({ block: 'center' });
    row?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')?.focus({
      preventScroll: true,
    });
  }
</script>

<section
  bind:this={sectionElement}
  class="additional-items"
  aria-label={message('tuple.additionalItems')}
>
  <header>
    <div class="additional-items-title">
      <h3>{message('tuple.additionalItems')}</h3>
      <ValidationIcon
        errors={items.forbiddenTailErrors}
        showCount={false}
        data-additional-items-errors
      />
    </div>
    <Action kind="add" label={message('tuple.add')} disabled={!items.canAdd} onclick={items.add} />
  </header>
  {#if items.tailErrorCount > 0 && items.showTailSummary}
    <p
      role="alert"
      data-additional-items-summary
      class="my-2 text-sm text-red-600 dark:text-red-400"
    >
      <span data-additional-items-summary-message
        >{arrayChildNotice(items.tailErrorCount, items.showTailSummaryCount, message)}</span
      >
      <button type="button" class="ms-2 underline" onclick={revealFirstTailError}
        >{message('collection.firstError')}</button
      >
    </p>
  {/if}
  <div class="additional-items-list">
    <!-- Tail occurrences survive explicit removals; fixed tuple positions remain positional. -->
    {#each items.page.indices as offset (items.rowKeys[definition.prefix.length + offset])}
      {@const index = definition.prefix.length + offset}
      <div class="additional-item" data-additional-item={index}>
        <div class="additional-item-value">
          <CollectionItem
            identity={items.rowKeys[index]}
            path={[props.binding.control.path, index].filter((part) => part !== '').join('.')}
            sourceItem={props.binding.control.data[index]}
          >
            {@render renderItem(index)}
          </CollectionItem>
        </div>
        <div class="additional-item-actions">
          <Action
            kind="delete"
            disabled={!items.canDelete}
            onclick={() => items.remove(index)}
            label={message('tuple.delete', {
              label: message('tuple.position', { position: index + 1 }),
            })}
          />
        </div>
      </div>
    {/each}
  </div>
  <CollectionPager page={items.page} />
  {#if items.message}<p
      role="alert"
      data-tuple-draft
      class="text-sm text-red-600 dark:text-red-400"
    >
      {items.message}
    </p>{/if}
</section>

{#if items.pending && props.binding.control.visible}
  <ConfirmationDialog
    operation={items.pending.operation}
    onAccept={items.accept}
    onCancel={items.cancel}
  />
{/if}

<style>
  .additional-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid;
    border-color: inherit;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .additional-items-title {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  h3 {
    font-size: 0.95rem;
    font-weight: 600;
  }
  .additional-items-list {
    display: grid;
    gap: 1rem;
  }
  .additional-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    min-width: 0;
  }
  .additional-item-value {
    flex: 1;
    min-width: 0;
  }
  .additional-item-actions {
    padding-top: 1.75rem;
    flex: none;
  }
</style>
