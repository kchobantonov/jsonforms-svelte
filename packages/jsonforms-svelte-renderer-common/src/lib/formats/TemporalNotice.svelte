<script lang="ts">
  const {
    controlId,
    kind,
    text,
    class: className,
  }: { controlId: string; kind: 'hint' | 'range'; text?: string; class: string } = $props();
</script>

{#if text}
  <p id={`${controlId}-draft-${kind}`} role={kind === 'hint' ? 'note' : 'alert'} class={className}>
    {text}
  </p>
{/if}
