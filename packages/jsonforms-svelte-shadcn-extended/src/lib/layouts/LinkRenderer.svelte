<script lang="ts">
  import type { RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useLink } from '@chobantonov/jsonforms-svelte-extended';

  const props: RendererProps<Layout> = $props();
  const link = useLink(props);
</script>

{#if link.visible}
  {#if link.href}
    <!-- Form-authored URLs use the shared URL policy, not SvelteKit route resolution. -->
    <!-- eslint-disable svelte/no-navigation-without-resolve -->
    <a
      href={link.href}
      target={link.target}
      rel={link.rel}
      class="text-primary underline underline-offset-4">{link.label}</a
    >
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
  {:else}<span data-link-inert>{link.label}</span>{/if}
{/if}
