<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import * as Field from '$lib/components/ui/field';
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

  // `has-[]` propagates focus/error colour from any descendant up to the label
  // and helper text without extra prop drilling.
  const baseClasses = $derived(
    twMerge(
      'has-[:focus-visible]:text-primary',
      'has-[[aria-invalid="true"]]:text-destructive',
      styles?.control?.root,
    ),
  );
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
    <Field.Field
      {id}
      orientation="horizontal"
      data-invalid={hasErrors || undefined}
      class={baseClasses}
    >
      {@render children()}
      <Field.Content>
        {#if label}
          <Field.Label for={id + '-input'} class="cursor-pointer">
            <span class="block min-w-0 truncate">{label}</span>
            {@render asterisk()}
          </Field.Label>
        {/if}
        {@render helperContent()}
      </Field.Content>
    </Field.Field>
  {:else}
    <Field.Field {id} data-invalid={hasErrors || undefined} class={baseClasses}>
      {#if label}
        <Field.Label for={id + '-input'} class="flex max-w-full items-center overflow-hidden">
          <span class="block min-w-0 truncate">{label}</span>
          {@render asterisk()}
        </Field.Label>
      {/if}
      {@render children()}
      {@render helperContent()}
    </Field.Field>
  {/if}
{/if}
