<script lang="ts">
  import { useRowDetailPanel } from '../../src/lib/rowDetail.svelte';

  let {
    rows,
    keys,
  }: {
    rows: Array<{ name: string }>;
    keys: string[];
  } = $props();
  const panel = useRowDetailPanel({
    options: () => ({ presentation: 'panel' }),
    rows: () => rows,
    keys: () => keys,
    prepare: () => true,
  });
</script>

<button type="button" onclick={() => panel.select(1)}>Select second row</button>
<output data-testid="selected-source"
  >{(panel.selectedItem as { name: string } | undefined)?.name}</output
>
