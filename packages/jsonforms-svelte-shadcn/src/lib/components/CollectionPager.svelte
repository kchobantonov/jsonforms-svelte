<script lang="ts">
  import SelectContent from './SelectContent.svelte';
  import {
    CollectionPagerFrame,
    type CollectionPage,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  let { page }: { page: CollectionPage } = $props();
</script>

<CollectionPagerFrame {page}>
  {#snippet sizeSelect(label, change)}
    <Select.Root type="single" value={String(page.size)} onValueChange={change}>
      <Select.Trigger aria-label={label} class="w-20">{page.size}</Select.Trigger>
      <SelectContent>
        {#each page.choices as size (size)}<Select.Item value={String(size)} label={String(size)}
            >{size}</Select.Item
          >{/each}
      </SelectContent>
    </Select.Root>
  {/snippet}
  {#snippet button(attributes, text, error)}<Button
      {...attributes}
      variant="outline"
      size={error ? 'sm' : 'icon-sm'}>{text}</Button
    >{/snippet}
</CollectionPagerFrame>
