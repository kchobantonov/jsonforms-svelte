<script lang="ts">
  import type { Snippet } from 'svelte';
  let { text, children }: { text: string; children: Snippet<[string]> } = $props();
  const id = $props.id();
</script>

<span class="action-hint">
  {@render children(id)}
  <span {id} role="tooltip" class="hint">{text}</span>
</span>

<style>
  .action-hint {
    position: relative;
    display: inline-flex;
  }
  .hint {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 15rem;
    padding: 0.4rem 0.6rem;
    border-radius: 0.25rem;
    background: #222;
    color: #fff;
    font-size: 0.75rem;
    white-space: normal;
    pointer-events: none;
    z-index: 50;
    visibility: hidden;
    opacity: 0;
  }
  .action-hint:hover .hint,
  .action-hint:focus-within .hint {
    visibility: visible;
    opacity: 1;
  }
</style>
