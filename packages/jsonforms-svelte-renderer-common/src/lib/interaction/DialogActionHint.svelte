<script lang="ts">
  import type { Snippet } from 'svelte';
  let {
    text,
    placement = 'top',
    align = 'center',
    children,
  }: {
    text: string;
    placement?: 'top' | 'bottom';
    align?: 'center' | 'end';
    children: Snippet<[string]>;
  } = $props();
  const id = $props.id();
</script>

<span class="action-hint" class:below={placement === 'bottom'} class:end={align === 'end'}>
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
  .action-hint.below .hint {
    top: calc(100% + 0.5rem);
    bottom: auto;
  }
  .action-hint.end .hint {
    right: 0;
    left: auto;
    transform: none;
  }
</style>
