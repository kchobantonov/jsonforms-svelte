<script lang="ts">
  import DemoNavbar from '$shadcnDemo/DemoNavbar.svelte';
  import ShadcnLogo from '$lib/components/ShadcnLogo.svelte';
</script>

<DemoNavbar title="JSON Forms Shadcn Svelte">
  {#snippet logo()}<ShadcnLogo
      width={32}
      height={32}
      class="text-foreground transition-transform duration-200 hover:rotate-[-10deg]"
    />{/snippet}
</DemoNavbar>
