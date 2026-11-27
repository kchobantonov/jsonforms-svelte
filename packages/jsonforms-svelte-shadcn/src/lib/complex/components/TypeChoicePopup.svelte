<script lang="ts">
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import SelectContent from '../../components/SelectContent.svelte';
  const { items }: { items: { value: string; name: string }[] } = $props();
</script>

<SelectContent class="max-w-[calc(100dvw-1rem)]">
  {#each items as item (item.value)}
    <Select.Item
      value={item.value}
      label={item.name}
      class="max-w-full min-w-0 [&>span:last-child]:min-w-0 [&>span:last-child]:break-words [&>span:last-child]:whitespace-normal"
      >{item.name}</Select.Item
    >
  {/each}
</SelectContent>
