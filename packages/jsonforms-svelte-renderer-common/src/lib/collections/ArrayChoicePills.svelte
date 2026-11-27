<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import type { useArrayChoices } from './arrayChoices.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const message = useRendererMessages();
  const {
    model,
    pillClass,
    errorClass,
    ValidationBadge,
    errorIcon,
    remove,
    containEvents = false,
  }: {
    model: ReturnType<typeof useArrayChoices>;
    pillClass: string;
    errorClass: string;
    ValidationBadge: Component<{ errors: ErrorObject[]; showCount?: boolean; children: Snippet }>;
    errorIcon: Snippet;
    remove: Snippet<
      [
        {
          disabled: boolean;
          'aria-label': string;
          onkeydown?: (event: KeyboardEvent) => void;
          onclick(event: MouseEvent): void;
        },
      ]
    >;
    containEvents?: boolean;
  } = $props();
</script>

{#each model.values as value, index (index)}
  {@const invalid = !!model.itemError(index)}
  {@const label = model.label(value)}
  <span class={[pillClass, invalid ? errorClass : 'border-transparent']} aria-invalid={invalid}>
    <span class="min-w-0 truncate" title={label}>{label}</span>
    {#if invalid}<ValidationBadge errors={model.itemErrors(index)} showCount={false}
        >{@render errorIcon()}</ValidationBadge
      >{/if}
    {@render remove({
      disabled: !model.canRemove,
      'aria-label': message('arrayChoices.remove', { label }),
      onkeydown: containEvents ? (event) => event.stopPropagation() : undefined,
      onclick: (event) => {
        if (containEvents) event.stopPropagation();
        model.remove(index);
      },
    })}
  </span>
{/each}
