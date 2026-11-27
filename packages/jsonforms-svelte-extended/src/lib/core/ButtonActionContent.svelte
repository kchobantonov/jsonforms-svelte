<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import type { useButtonAction } from './buttonAction.svelte';
  const {
    action,
    class: className = 'w-full',
    button,
    attributes,
  }: {
    action: ReturnType<typeof useButtonAction>;
    class?: string;
    button?: Snippet<[Snippet]>;
    attributes?: HTMLButtonAttributes;
  } = $props();
  const message = useRendererMessages();
</script>

{#snippet label()}
  {#if action.binding.button.icon}
    <span aria-hidden="true" class="shrink-0">{action.binding.button.icon}</span>
  {/if}
  {#if action.binding.button.label}
    <span>{action.loading ? `${action.binding.button.label}...` : action.binding.button.label}</span
    >
  {:else if action.loading}
    <span>{message('button.running')}</span>
  {/if}
{/snippet}

{#if action.binding.button.visible}
  <div class={className}>
    {#if action.scriptDenied}
      <p role="status" data-button-diagnostic="script.evaluationDisabled">
        {message('button.scriptDisabled')}
      </p>
    {:else}
      {#if button}{@render button(label)}{:else}<button {...attributes}>{@render label()}</button
        >{/if}
    {/if}
    {#if action.scriptResult === 'unavailable'}
      <p role="status">
        {message('button.scriptUnavailable')}
      </p>
    {/if}
  </div>
{/if}
