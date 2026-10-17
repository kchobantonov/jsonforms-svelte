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

<div class:typography>{@render renderNodes(parsed.nodes)}</div>
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
  .typography :global(ul) {
    list-style: disc;
    padding-inline-start: 1.5rem;
  }
  .typography :global(ol) {
    list-style: decimal;
    padding-inline-start: 1.5rem;
  }
  .typography :global(a) {
    text-decoration: underline;
  }
  .typography :global(pre) {
    white-space: pre-wrap;
  }
  .typography :global(blockquote) {
    border-inline-start: 2px solid currentColor;
    padding-inline-start: 1rem;
  }
  .typography :global(h1),
  .typography :global(h2),
  .typography :global(h3),
  .typography :global(h4),
  .typography :global(h5),
  .typography :global(h6) {
    font-weight: 600;
    margin-block: 0.75rem 0.5rem;
  }
  .typography :global(h1) {
    font-size: 2rem;
  }
  .typography :global(h2) {
    font-size: 1.5rem;
  }
  .typography :global(h3) {
    font-size: 1.25rem;
  }
  .typography :global(table) {
    border-collapse: collapse;
  }
  .typography :global(th),
  .typography :global(td) {
    border: 1px solid currentColor;
    padding: 0.25rem 0.5rem;
  }
</style>
