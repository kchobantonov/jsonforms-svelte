<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import LayoutChild from './LayoutChild.svelte';
  import InitialFocusView from '../interaction/InitialFocusView.svelte';
  const {
    layout,
    entry,
    selected,
  }: {
    layout: ComponentProps<typeof LayoutChild>['layout'];
    entry: { key: string; category: Pick<ComponentProps<typeof LayoutChild>, 'uischema'> };
    selected: string | undefined;
  } = $props();
</script>

<InitialFocusView active={selected === entry.key}
  ><LayoutChild {layout} uischema={entry.category.uischema} /></InitialFocusView
>
