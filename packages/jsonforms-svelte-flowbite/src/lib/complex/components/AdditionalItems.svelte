<script lang="ts">
  import {
    useAdditionalItems,
    useTranslator,
    type AdditionalItemsProps,
  } from '@chobantonov/jsonforms-svelte';
  import Action from '../../components/TupleAction.svelte';
  const props: AdditionalItemsProps = $props();
  const state = useAdditionalItems(props);
  const t = useTranslator();
  const definition = $derived(props.definition);
  const renderItem = $derived(props.renderItem);
</script>

<section class="additional-items" aria-label={t.value('tuple.additional', 'Additional items')}>
  <header>
    <h3>{t.value('tuple.additional', 'Additional items')}</h3>
    {#if definition.tail !== false}<Action
        kind="add"
        label={t.value('tuple.add', 'Add item')}
        disabled={!state.canAdd}
        onclick={state.add}
      />{/if}
  </header>
  <div class="additional-items-list">
    {#each state.data.slice(definition.prefix.length) as _, offset}
      {@const index = definition.prefix.length + offset}
      <div class="additional-item" data-additional-item={index}>
        <div class="additional-item-value">{@render renderItem(index)}</div>
        <div class="additional-item-actions">
          <Action
            kind="delete"
            disabled={!state.canDelete}
            onclick={() => state.remove(index)}
            label={t.value('tuple.deletePosition', 'Delete Item ' + (index + 1), {
              position: index + 1,
            })}
          />
        </div>
      </div>
    {/each}
  </div>
  {#if state.message}<p role="alert">{state.message}</p>{/if}
</section>

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
