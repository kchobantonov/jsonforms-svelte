<script lang="ts">
  import Playground from './Playground.svelte';
  import { examples } from './examples/index.js';
  import '../lib/webcomponent-register.js';
</script>

<Playground {examples}>
  {#snippet form(playground)}
    <jsonforms-svelte-shadcn
      bind:this={playground.formEl}
      mode={playground.mode}
      theme={playground.selectedTheme}
      onchange={playground.onChange}
    ></jsonforms-svelte-shadcn>
  {/snippet}
</Playground>
