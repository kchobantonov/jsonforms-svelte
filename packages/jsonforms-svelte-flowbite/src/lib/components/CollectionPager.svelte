<script lang="ts">
  import {
    CollectionPagerFrame,
    type CollectionPage,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Select } from 'flowbite-svelte';
  let { page }: { page: CollectionPage } = $props();
</script>

<CollectionPagerFrame {page}>
  {#snippet sizeSelect(label, change)}
    <Select
      placeholder=""
      size="sm"
      class="w-20"
      aria-label={label}
      value={String(page.size)}
      items={page.choices.map((size) => ({ value: String(size), name: String(size) }))}
      onchange={(event) => change(event.currentTarget.value)}
    />
  {/snippet}
  {#snippet button(attributes, text)}<Button {...attributes} color="alternative" size="sm"
      >{text}</Button
    >{/snippet}
</CollectionPagerFrame>
