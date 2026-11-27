<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import DemoLayout from '$shadcnDemo/DemoLayout.svelte';
  import '../app.css';
  import { sketchElements } from '@chobantonov/jsonforms-svelte-shadcn-sketch-ui/outlines';

  const { children } = $props();
</script>

<div class="min-h-screen" use:sketchElements>
  <DemoLayout {children}>
    {#snippet navbar()}<Navbar />{/snippet}
  </DemoLayout>
</div>
