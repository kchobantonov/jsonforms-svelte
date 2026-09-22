<script lang="ts">
  import { setContext } from 'svelte';
  import type { DispatchRendererProps } from './DispatchRenderer.svelte';
  import { ScalarErrorsSymbol, type ScalarErrorsContext } from '../scalarErrors';
  import DispatchRenderer from './DispatchRenderer.svelte';
  const props: DispatchRendererProps = $props();
  setContext<ScalarErrorsContext>(ScalarErrorsSymbol, {
    get path() {
      return props.path ?? '';
    },
  });
</script>

<DispatchRenderer {...props} />
