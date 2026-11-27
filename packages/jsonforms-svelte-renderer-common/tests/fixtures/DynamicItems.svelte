<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import CollectionItem from '../../src/lib/collections/CollectionItem.svelte';
  import { DispatchRenderer } from '../../src/lib/index.js';

  const form = useJsonForms();
  const items = $derived(
    (form.core?.data as { items?: { id: string; name: string }[] } | undefined)?.items ?? [],
  );
  const child = {
    type: 'Control',
    scope: '#/properties/name',
    label: 'Static',
    $dynamic: { label: { template: '{item.name}: {value}' } },
  } as unknown as UISchemaElement;
</script>

{#each items as item, index (item.id)}
  <div data-item={item.id}>
    {#snippet content()}
      <DispatchRenderer
        schema={{ type: 'object', properties: { name: { type: 'string' } } }}
        uischema={child}
        path={`items.${index}`}
      />
    {/snippet}
    <CollectionItem identity={item.id} path={`items.${index}`} children={content} />
  </div>
{/each}
