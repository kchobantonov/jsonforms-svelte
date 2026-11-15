<script lang="ts">
  import { useJsonForms } from '../../src/lib/jsonFormsCompositions.svelte';
  import CollectionItem from '../../src/lib/components/CollectionItem.svelte';
  import DispatchRenderer from '../../src/lib/components/DispatchRenderer.svelte';
  const form = useJsonForms();
  const items = $derived(
    (form.core?.data as { items: { id: string; kind: string; name: string }[] }).items,
  );
  const detail = {
    type: 'Categorization',
    elements: [
      { type: 'Category', $dynamic: { type: { bind: 'item.kind' }, label: { bind: 'item.name' } } },
    ],
  };
</script>

{#each items as item, index (item.id)}
  <div data-item={item.id}>
    {#snippet content()}
      <DispatchRenderer schema={{ type: 'object' }} uischema={detail} path={`items.${index}`} />
    {/snippet}
    <CollectionItem identity={item.id} path={`items.${index}`} children={content} />
  </div>
{/each}
