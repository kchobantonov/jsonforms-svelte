<script lang="ts">
  import CollectionRows from './CollectionRows.svelte';
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import type { useArrayLayout } from './arrayLayout.svelte';
  const {
    control,
    layout,
    ValidationIcon,
    children: row,
  }: {
    control: ComponentProps<typeof CollectionRows>['control'];
    layout: ReturnType<typeof useArrayLayout>;
    ValidationIcon: Component<{ errors: ErrorObject[]; 'data-row-summary': boolean }>;
    children: Snippet<[number]>;
  } = $props();
</script>

<CollectionRows indices={layout.collection.page.indices} {control}>
  {#snippet children(index)}
    <div class="relative">
      {@render row(index)}
      <div class={`absolute top-4 z-10 ${layout.hideAvatar ? 'start-1' : 'start-10'}`}>
        <ValidationIcon data-row-summary errors={layout.collection.childErrors(index)} />
      </div>
    </div>
  {/snippet}
</CollectionRows>
