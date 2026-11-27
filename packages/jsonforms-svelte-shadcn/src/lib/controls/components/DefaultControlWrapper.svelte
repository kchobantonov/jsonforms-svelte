<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import * as Field from '@jsonforms-svelte-shadcn-ui/field';
  import { useControlLabel } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ControlWrapperProps } from '../../util';

  const props: ControlWrapperProps = $props();
  const { id, label, visible, styles, children } = $derived(props);
  const labelState = useControlLabel(props);
  const { hasErrors, helpMessage, accessory } = $derived(labelState);

  // Keep the label neutral for value errors. Invalid property names apply their
  // own label colour in AdditionalProperties, where the label itself is wrong.
  const baseClasses = $derived(twMerge('has-[:focus-visible]:text-primary', styles?.control?.root));
</script>

{#snippet asterisk()}
  {#if labelState.showAsterisk}
    <span aria-hidden="true" class={twMerge('text-destructive ms-0.5', styles?.control?.asterisk)}
      >*</span
    >
  {/if}
{/snippet}

{#snippet helperContent()}
  {#if helpMessage}
    <p
      {...labelState.helperAttributes}
      class={twMerge(
        'min-h-[1rem] text-xs wrap-break-word hyphens-auto transition-opacity duration-200',
        hasErrors ? 'text-destructive' : 'text-muted-foreground',
        helpMessage ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {helpMessage}
    </p>
  {/if}
{/snippet}

{#snippet fieldLabel()}
  <Field.Label
    for={id + '-input'}
    class={twMerge(
      'text-foreground block wrap-break-word whitespace-normal',
      props.layout === 'horizontal'
        ? 'min-w-0 cursor-pointer'
        : accessory
          ? 'min-w-0'
          : 'max-w-full',
    )}
  >
    <span class="wrap-break-word whitespace-normal">{label}</span>
    {@render asterisk()}
  </Field.Label>
{/snippet}

{#snippet labelContent()}
  {#if label}
    {#if accessory}
      <div class="flex w-fit max-w-full min-w-0 items-start gap-1">
        {@render fieldLabel()}{@render accessory()}
      </div>
    {:else}
      {@render fieldLabel()}
    {/if}
  {/if}
{/snippet}
{#if visible}
  {#if props.layout === 'horizontal'}
    <Field.Field {id} orientation="horizontal" class={baseClasses}>
      {@render children()}
      <Field.Content>
        {@render labelContent()}
        {@render helperContent()}
      </Field.Content>
    </Field.Field>
  {:else}
    <Field.Field {id} class={baseClasses}>
      {@render labelContent()}
      {@render children()}
      {@render helperContent()}
    </Field.Field>
  {/if}
{/if}
