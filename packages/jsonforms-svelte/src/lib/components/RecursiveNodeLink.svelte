<script lang="ts">
  import { getContext } from 'svelte';
  import { useJsonFormsControl, type ControlProps } from '../jsonFormsCompositions.svelte';
  import {
    RecursiveTreeNavigationSymbol,
    type RecursiveTreeNavigation,
  } from '../recursiveTreeContext';
  import { LiteralDataContextSymbol, type LiteralDataContext } from '../literalDataContext';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const navigation = getContext<RecursiveTreeNavigation>(RecursiveTreeNavigationSymbol);
  const literal = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  const label = $derived(binding.control.data?.[navigation.labelProperty]);
  const Link = navigation.Link;
</script>

<Link
  onclick={() => {
    if (literal)
      navigation.selectSegments([
        ...literal.segments(),
        ...(binding.control.path ? binding.control.path.split('.') : []),
      ]);
    else navigation.selectPath(binding.control.path);
  }}
>
  {typeof label === 'string' && label.trim()
    ? label
    : String(Number(binding.control.path.split('.').at(-1)) + 1)}
</Link>
