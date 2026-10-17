<script lang="ts">
  import { getContext } from 'svelte';
  import { useJsonFormsControl, type ControlProps } from '../jsonFormsCompositions.svelte';
  import {
    RecursiveTreeNavigationSymbol,
    type RecursiveTreeNavigation,
  } from '../recursiveTreeContext';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const navigation = getContext<RecursiveTreeNavigation>(RecursiveTreeNavigationSymbol);
  const label = $derived(binding.control.data?.[navigation.labelProperty]);
  const Link = navigation.Link;
</script>

<Link onclick={() => navigation.selectPath(binding.control.path)}>
  {typeof label === 'string' && label.trim()
    ? label
    : String(Number(binding.control.path.split('.').at(-1)) + 1)}
</Link>
