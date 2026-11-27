<script lang="ts">
  import type { Component } from 'svelte';
  const {
    save,
    Save,
    Reload,
  }: { save: boolean; Save: Component<{ class: string }>; Reload: Component<{ class: string }> } =
    $props();
  const Icon = $derived(save ? Save : Reload);
</script>

<Icon class="size-4" />
