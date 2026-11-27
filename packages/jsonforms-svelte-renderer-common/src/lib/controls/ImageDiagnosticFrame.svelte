<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ImageViewDiagnostic } from './imageView';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const { diagnostic, children }: { diagnostic: ImageViewDiagnostic; children: Snippet<[string]> } =
    $props();
  const message = useRendererMessages();
</script>

<div
  role="alert"
  data-image-diagnostic={diagnostic.code}
  class="my-2 flex max-w-full min-w-0 items-center gap-2 rounded border p-2 text-sm [overflow-wrap:anywhere]"
>
  {@render children(message('image.warningDetails'))}
  <span data-image-summary
    >{message(
      diagnostic.code === 'image.urlRefused' ? 'image.blocked' : 'image.configurationWarning',
    )}</span
  >
</div>
