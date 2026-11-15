<script lang="ts">
  import type { RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useLink } from '@chobantonov/jsonforms-svelte-extended';
  import { A } from 'flowbite-svelte';

  const props: RendererProps<Layout> = $props();
  const link = useLink(props);
</script>

{#if link.visible}
  {#if link.href}
    <A href={link.href} target={link.target} rel={link.rel}>{link.label}</A>
  {:else}<span data-link-inert>{link.label}</span>{/if}
{/if}
