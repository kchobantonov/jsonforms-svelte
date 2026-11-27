<script lang="ts">
  import HomePage from '$shadcnDemo/HomePage.svelte';
  import ShadcnBigLogo from '$lib/components/ShadcnBigLogo.svelte';
</script>

<HomePage library="Shadcn">
  {#snippet logo()}<ShadcnBigLogo
      class="text-foreground absolute top-0 left-0 z-10 size-full drop-shadow-md"
    />{/snippet}
</HomePage>
