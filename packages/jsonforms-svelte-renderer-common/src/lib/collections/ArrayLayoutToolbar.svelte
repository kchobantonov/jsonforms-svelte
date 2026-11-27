<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import type { useArrayLayout } from './arrayLayout.svelte';
  const {
    collection,
    binding,
    titleClass,
    labelClass,
    CollectionPanelToggle,
    ValidationIcon,
    panelContentId,
    Header,
    toolbarClass,
    heading,
    add,
  }: {
    collection: ReturnType<typeof useArrayLayout>['collection'];
    binding: {
      computedLabel: string;
      styles: { arrayList: { validationIcon?: string } };
      appliedOptions: Record<string, unknown>;
    };
    Header?: Component<{ class: string; children: Snippet }>;
    toolbarClass: string;
    titleClass: string;
    labelClass: string;
    CollectionPanelToggle: Component<{
      panel: ReturnType<typeof useArrayLayout>['collection']['panel'];
      id: string;
      label: string;
    }>;
    ValidationIcon: Component<{
      errors: ErrorObject[];
      class?: string;
      'data-array-summary': boolean;
    }>;
    panelContentId: string;
    heading?: Snippet<[string, string]>;
    add: Snippet;
  } = $props();
  const label = $derived(binding.computedLabel);
</script>

{#snippet content()}
  <div class={titleClass}>
    {#if heading}{@render heading(label, labelClass)}{:else}<h3 class={labelClass}>{label}</h3>{/if}
    {#if collection.headerErrors.length && binding.appliedOptions.showValidationIndicator !== false}
      <ValidationIcon
        data-array-summary
        errors={collection.headerErrors}
        class={binding.styles.arrayList.validationIcon}
      />
    {/if}
  </div>
  <div class="flex items-center gap-2">
    <CollectionPanelToggle panel={collection.panel} id={panelContentId} {label} />
    {@render add()}
  </div>
{/snippet}
{#if Header}<Header class={toolbarClass}>{@render content()}</Header>{:else}<div
    class={toolbarClass}
  >
    {@render content()}
  </div>{/if}
