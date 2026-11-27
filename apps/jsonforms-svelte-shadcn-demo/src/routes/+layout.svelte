<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import DemoLayout from '$shadcnDemo/DemoLayout.svelte';
  import '../app.css';

  const { children } = $props();
</script>

<div class="bg-noise min-h-screen">
  <DemoLayout {children}>
    {#snippet navbar()}<Navbar />{/snippet}
  </DemoLayout>
</div>
