<script lang="ts">
  const { title }: { title: string } = $props();
</script>

<svelte:head><title>{title}</title><meta name="description" content={title} /></svelte:head>
