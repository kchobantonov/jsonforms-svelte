<script lang="ts">
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import LiteralControlScope, { type LiteralControlProps } from './LiteralControlScope.svelte';

  let props: LiteralControlProps = $props();
</script>

<LiteralControlScope {...props} dispatchRenderer={DispatchRenderer} />
