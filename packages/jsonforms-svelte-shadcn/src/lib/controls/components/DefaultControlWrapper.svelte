<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import * as Field from '@jsonforms-svelte-shadcn-ui/field';
  import {
    LiteralLabelAccessorySymbol,
    type LiteralLabelAccessory,
  } from '@chobantonov/jsonforms-svelte';
  import { getContext } from 'svelte';
  import type { ControlWrapperProps } from '../../util';

  const {
    id,
    description,
    errors,
    label,
    visible,
    required,
    isFocused,
    styles,
    appliedOptions,
    persistentHint,
    children,
    layout = 'vertical',
  }: ControlWrapperProps & { layout?: 'vertical' | 'horizontal' } = $props();

  const hasErrors = $derived(!!errors?.trim());
  const showDescription = $derived(!hasErrors && !!description && (isFocused || persistentHint));
  const helpMessage = $derived(hasErrors ? errors : showDescription ? description : '');
  const showAsterisk = $derived(label && required && !appliedOptions.hideRequiredAsterisk);
  const labelAccessory = getContext<(() => LiteralLabelAccessory) | undefined>(
    LiteralLabelAccessorySymbol,
  );
  const accessory = $derived(labelAccessory?.());
  const showAccessory = $derived(accessory?.label === label && !!accessory?.snippet);

  // Keep the label neutral for value errors. Invalid property names apply their
  // own label colour in AdditionalProperties, where the label itself is wrong.
  const baseClasses = $derived(twMerge('has-[:focus-visible]:text-primary', styles?.control?.root));
</script>

{#snippet asterisk()}
  {#if showAsterisk}
    <span aria-hidden="true" class={twMerge('text-destructive ms-0.5', styles?.control?.asterisk)}
      >*</span
    >
  {/if}
{/snippet}

{#snippet helperContent()}
  {#if helpMessage}
    <p
      id={id + '-help'}
      role={hasErrors ? 'alert' : 'note'}
      aria-live={hasErrors ? 'assertive' : 'polite'}
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

{#if visible}
  {#if layout === 'horizontal'}
    <Field.Field {id} orientation="horizontal" class={baseClasses}>
      {@render children()}
      <Field.Content>
        {#if label}
          {#if showAccessory}
            <div class="flex min-w-0 items-center gap-1">
              <Field.Label for={id + '-input'} class="text-foreground min-w-0 cursor-pointer">
                <span class="block min-w-0 truncate">{label}</span>
                {@render asterisk()}
              </Field.Label>
              {@render accessory!.snippet!()}
            </div>
          {:else}
            <Field.Label for={id + '-input'} class="text-foreground cursor-pointer">
              <span class="block min-w-0 truncate">{label}</span>
              {@render asterisk()}
            </Field.Label>
          {/if}
        {/if}
        {@render helperContent()}
      </Field.Content>
    </Field.Field>
  {:else}
    <Field.Field {id} class={baseClasses}>
      {#if label}
        {#if showAccessory}
          <div class="flex min-w-0 items-center gap-1">
            <Field.Label
              for={id + '-input'}
              class="text-foreground flex min-w-0 items-center overflow-hidden"
            >
              <span class="block min-w-0 truncate">{label}</span>
              {@render asterisk()}
            </Field.Label>
            {@render accessory!.snippet!()}
          </div>
        {:else}
          <Field.Label
            for={id + '-input'}
            class="text-foreground flex max-w-full items-center overflow-hidden"
          >
            <span class="block min-w-0 truncate">{label}</span>
            {@render asterisk()}
          </Field.Label>
        {/if}
      {/if}
      {@render children()}
      {@render helperContent()}
    </Field.Field>
  {/if}
{/if}
