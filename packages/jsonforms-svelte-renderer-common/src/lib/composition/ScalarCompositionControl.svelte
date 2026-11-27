<script lang="ts">
  import { setContext } from 'svelte';
  import {
    type DispatchRendererProps,
    default as DispatchRenderer,
  } from '../core/DispatchRenderer.svelte';
  import { ScalarErrorsSymbol, type ScalarErrorsContext } from '../validation/scalarErrors.js';
  const props: DispatchRendererProps = $props();
  setContext<ScalarErrorsContext>(ScalarErrorsSymbol, {
    get path() {
      return props.path ?? '';
    },
  });
</script>

<DispatchRenderer {...props} />
