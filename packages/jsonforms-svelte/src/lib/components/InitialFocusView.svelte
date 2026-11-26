<script lang="ts">
  // fallow-ignore-file unrendered-component -- consumed through the published core package
  import { getContext, setContext, type Snippet } from 'svelte';
  import { InitialFocusViewSymbol } from '../initialFocusDiagnostic.svelte';

  let { active, children }: { active: boolean; children: Snippet } = $props();
  const parent = getContext<(() => boolean) | undefined>(InitialFocusViewSymbol);
  setContext(InitialFocusViewSymbol, () => active && (parent?.() ?? true));
</script>

{@render children()}
