<script lang="ts">
  import { getContext } from 'svelte';
  import { CardPresentationContext, type UrlPolicy } from '@chobantonov/jsonforms-svelte';
  import { parseMarkdown, type MarkdownNode, type MarkdownProfile } from './markdown';
  import { usePresentationMessages } from './messages.svelte';

  const {
    text,
    profile,
    urlPolicy,
    typography = true,
  }: {
    text: string;
    profile: MarkdownProfile;
    urlPolicy: UrlPolicy;
    typography?: boolean;
  } = $props();
  const inCard = getContext<boolean>(CardPresentationContext) === true;
  const parsed = $derived(parseMarkdown(text, profile, urlPolicy));
  const message = usePresentationMessages();
</script>

{#snippet renderNodes(nodes: MarkdownNode[])}
  {#each nodes as node, index (index)}
    {#if node.type === 'text'}{node.text}
    {:else if inCard && node.tag === 'a'}<span>{@render renderNodes(node.children)}</span>
    {:else if node.tag === 'br'}<br />
    {:else}<svelte:element this={node.tag} {...node.attributes}
        >{@render renderNodes(node.children)}</svelte:element
      >{/if}
  {/each}
{/snippet}

<div class="markup-content" class:typography>{@render renderNodes(parsed.nodes)}</div>
{#if parsed.refusedUrls.length > 0}
  <p role="alert" data-markup-diagnostic="urlRefused">{message('urlRefused')}</p>
{/if}

<style>
  .typography {
    overflow-wrap: anywhere;
  }
  .typography :global(p + p),
  .typography :global(ul),
  .typography :global(ol),
  .typography :global(pre),
  .typography :global(blockquote) {
    margin-block: 0.5rem;
  }
  .markup-content :global(ul) {
    list-style: disc;
    padding-inline-start: 1.5rem;
  }
  .markup-content :global(ol) {
    list-style: decimal;
    padding-inline-start: 1.5rem;
  }
  .markup-content :global(a) {
    text-decoration: underline;
  }
  .markup-content :global(pre) {
    white-space: pre-wrap;
  }
  .markup-content :global(blockquote) {
    border-inline-start: 2px solid currentColor;
    padding-inline-start: 1rem;
  }
  .markup-content :global(h1),
  .markup-content :global(h2),
  .markup-content :global(h3),
  .markup-content :global(h4),
  .markup-content :global(h5),
  .markup-content :global(h6) {
    font-weight: 600;
    margin-block: 0.75rem 0.5rem;
  }
  .markup-content :global(h1) {
    font-size: 2rem;
  }
  .markup-content :global(h2) {
    font-size: 1.5rem;
  }
  .markup-content :global(h3) {
    font-size: 1.25rem;
  }
  .markup-content :global(table) {
    border-collapse: collapse;
  }
  .markup-content :global(th),
  .markup-content :global(td) {
    border: 1px solid currentColor;
    padding: 0.25rem 0.5rem;
  }
</style>
