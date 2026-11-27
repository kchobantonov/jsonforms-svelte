<script lang="ts">
  import type { Snippet } from 'svelte';
  const {
    title,
    reloadLabel,
    applyLabel,
    onreload,
    onapply,
    invalid = false,
    level = 2,
    button,
  }: {
    title: string;
    reloadLabel: string;
    applyLabel: string;
    onreload(): void;
    onapply(): void;
    invalid?: boolean;
    level?: 2 | 3;
    button: Snippet<[boolean, string, () => void, boolean]>;
  } = $props();
</script>

<div class="flex items-center justify-between">
  {#if level === 2}<h2 class="text-xl font-bold">{title}</h2>{:else}<h3
      class="text-lg font-semibold"
    >
      {title}
    </h3>{/if}
  <div class="flex gap-2">
    {@render button(false, reloadLabel, onreload, false)}
    {@render button(true, applyLabel, onapply, invalid)}
  </div>
</div>
