<script lang="ts">
  import { useTranslator } from '../jsonFormsCompositions.svelte';

  const { id, value }: { id: string; value: unknown } = $props();
  const t = useTranslator();
  const label = $derived(t.value('numeric.incompatibleValue', 'Stored value'));
</script>

<span class="numeric-value-hint">
  <button type="button" aria-label={label} aria-describedby={id}>
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 3v1" />
    </svg>
  </button>
  <span {id} role="tooltip" class="hint"
    ><span>{label}</span><code>{JSON.stringify(value)}</code></span
  >
</span>

<style>
  .numeric-value-hint {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: help;
    border-radius: 0.25rem;
  }
  button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
  .hint {
    position: absolute;
    inset-inline-end: 0;
    bottom: calc(100% + 0.35rem);
    z-index: 50;
    width: max-content;
    max-width: min(22rem, 80vw);
    padding: 0.5rem;
    background: Canvas;
    color: CanvasText;
    border: 1px solid currentColor;
    border-radius: 0.3rem;
    box-shadow: 0 2px 8px #0003;
    font-size: 0.875rem;
    visibility: hidden;
    opacity: 0;
  }
  .numeric-value-hint:hover .hint,
  .numeric-value-hint:focus-within .hint {
    visibility: visible;
    opacity: 1;
  }
  code {
    display: block;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
