<script lang="ts">
  import {
    CollectionPagerFrame,
    type CollectionPage,
  } from '@chobantonov/jsonforms-svelte-renderer-common';

  let { page }: { page: CollectionPage } = $props();
</script>

<CollectionPagerFrame {page}>
  {#snippet sizeSelect(label, change)}
    <select
      class="select w-20"
      aria-label={label}
      value={page.size}
      onchange={(event) => change(event.currentTarget.value)}
    >
      {#each page.choices as size (size)}<option value={size}>{size}</option>{/each}
    </select>
  {/snippet}
  {#snippet button(attributes, text, error)}<button
      {...attributes}
      class={error ? 'btn btn-sm preset-tonal-error' : 'btn-icon btn-icon-sm preset-tonal'}
      >{text}</button
    >{/snippet}
</CollectionPagerFrame>
