<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import { useControlLabel } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ControlWrapperProps } from '../../util';

  const props: ControlWrapperProps = $props();
  const { id, description, label, visible, styles, children, appliedOptions } = $derived(props);
  const labelState = useControlLabel(props);
  const { hasErrors, helpMessage, accessory } = $derived(labelState);
  const hasAdornments = $derived(!!appliedOptions.startAdornment || !!appliedOptions.endAdornment);

  // Value errors belong on the input and helper; invalid property names apply
  // their own label colour in AdditionalProperties.
  const baseClasses = $derived(
    twMerge(
      'has-[:focus-visible]:text-primary-500 dark:has-[:focus-visible]:text-primary-400',
      styles?.control?.root,
    ),
  );
</script>

{#snippet asterisk()}
  {#if labelState.showAsterisk}
    <span
      aria-hidden="true"
      class={twMerge('text-error-500 dark:text-error-400 ms-0.5', styles?.control?.asterisk)}
      >*</span
    >
  {/if}
{/snippet}

{#snippet helperContent()}
  {#if helpMessage || description}
    <p
      id={id + '-help'}
      role={helpMessage ? (hasErrors ? 'alert' : 'note') : undefined}
      aria-hidden={!helpMessage}
      style:visibility={helpMessage ? 'visible' : 'hidden'}
      aria-live={hasErrors ? 'assertive' : 'polite'}
      class={twMerge(
        'min-h-[1rem] text-xs wrap-break-word hyphens-auto transition-opacity duration-200',
        hasErrors ? 'text-error-500 dark:text-error-400' : 'text-surface-500 dark:text-surface-400',
        helpMessage ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {helpMessage || description}
    </p>
  {/if}
{/snippet}

{#if visible}
  {#if props.layout === 'horizontal'}
    <!--
      Checkbox / Switch — horizontal layout.
      gap-2 is used (not space-x-2): space-x-* relies on margin-based child
      selectors which don't work reliably in Tailwind v4 flex contexts.
      ps-6 indents the helper to align under the label text.
    -->
    <div {id} class={twMerge('flex w-full min-w-0 flex-col', baseClasses)}>
      <div class="flex min-w-0 items-center gap-2 select-none">
        {@render children()}
        {#if label}
          {#if accessory}
            <div class="flex min-w-0 flex-1 items-start gap-1">
              <label
                for={id + '-input'}
                class="block min-w-0 flex-1 cursor-pointer text-sm wrap-break-word whitespace-normal"
              >
                <span class="wrap-break-word whitespace-normal">{label}</span>
                {@render asterisk()}
              </label>
              {@render accessory()}
            </div>
          {:else}
            <label
              for={id + '-input'}
              class="block min-w-0 flex-1 cursor-pointer text-sm wrap-break-word whitespace-normal"
            >
              <span class="wrap-break-word whitespace-normal">{label}</span>
              {@render asterisk()}
            </label>
          {/if}
        {/if}
      </div>
      <div class="ps-6">
        {@render helperContent()}
      </div>
    </div>
  {:else}
    <!-- Keep the native label utility while associating only the primary control.
         Compound renderers can contain several buttons, inputs and filenames. -->
    <div
      {id}
      class={twMerge(
        'label flex w-full min-w-0 flex-col',
        hasAdornments ? 'overflow-visible' : 'overflow-hidden',
        baseClasses,
      )}
    >
      {#if label}
        {#if accessory}
          <div class="flex min-w-0 items-start gap-1">
            <label
              for={id + '-input'}
              class="label-text block min-w-0 flex-1 wrap-break-word whitespace-normal"
            >
              <span class="wrap-break-word whitespace-normal">{label}</span>
              {@render asterisk()}
            </label>
            {@render accessory()}
          </div>
        {:else}
          <label
            for={id + '-input'}
            class="label-text block w-full min-w-0 wrap-break-word whitespace-normal"
          >
            <span class="wrap-break-word whitespace-normal">{label}</span>
            {@render asterisk()}
          </label>
        {/if}
      {/if}
      {@render children()}
      {@render helperContent()}
    </div>
  {/if}
{/if}
