<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { DurationMode, DurationUnit } from './duration';
  import type { useDurationControl } from './durationControl.svelte';
  const modes = ['components', 'weeks'] as const;
  const message = useRendererMessages();
  let {
    duration,
    modeButton,
    field,
    removeButton,
    id,
    wrappedLabel = false,
    addUnit,
  }: {
    duration: ReturnType<typeof useDurationControl>;
    modeButton: Snippet<
      [DurationMode, string, { 'aria-pressed': boolean; disabled: boolean; onclick(): void }]
    >;
    id: string;
    wrappedLabel?: boolean;
    removeButton: Snippet<[{ disabled: boolean; 'aria-label': string; onclick(): void }]>;
    field: Snippet<[DurationUnit, string | undefined]>;
    addUnit: Snippet<
      [
        { 'aria-label': string; value: string; disabled: boolean; onchange(event: Event): void },
        Snippet,
      ]
    >;
  } = $props();
</script>

{#snippet unitField(unit: DurationUnit, label: string, fieldId: string)}
  {#if wrappedLabel}
    <!-- The field snippet renders the associated native input. -->
    <label class="grid grid-cols-2 items-center gap-2"
      >{@render field(unit, undefined)}<span>{label}</span></label
    >
  {:else}
    {@render field(unit, fieldId)}
    <label for={fieldId}>{label}</label>
  {/if}
{/snippet}

<div class="space-y-3">
  <div class="flex gap-2">
    {#each modes as mode (mode)}
      {@render modeButton(
        mode,
        message(mode === 'components' ? 'duration.modeComponents' : 'duration.modeWeeks'),
        {
          'aria-pressed': duration.editor.mode === mode,
          disabled: duration.disabled,
          onclick: () => duration.editor.setMode(mode),
        },
      )}
    {/each}
  </div>
  {#each duration.editor.active as unit (unit)}
    {@const label = message(`duration.${unit}`)}
    {@const fieldId = `${id}-${unit}`}
    <div
      class={wrappedLabel
        ? 'grid grid-cols-[1fr_2rem] items-center gap-1'
        : 'grid min-w-0 grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-2'}
    >
      {@render unitField(unit, label, fieldId)}
      {#if duration.editor.mode === 'components' && duration.editor.active.length > 1}
        {@render removeButton({
          disabled: duration.disabled,
          'aria-label': message('duration.removeUnit', { unit: label }),
          onclick: () => duration.editor.remove(unit),
        })}
      {/if}
    </div>
  {/each}
  {#if duration.editor.mode === 'components' && duration.editor.available.length}
    {#snippet options()}
      <option value="" disabled>{message('duration.addUnit')}</option>
      {#each duration.editor.available as unit (unit)}
        <option value={unit}>{message(`duration.${unit}`)}</option>
      {/each}
    {/snippet}
    {@render addUnit(
      {
        'aria-label': message('duration.addUnit'),
        value: '',
        disabled: duration.disabled,
        onchange: (event: Event) => {
          const select = event.currentTarget as HTMLSelectElement;
          duration.editor.add(select.value as DurationUnit);
          select.value = '';
        },
      },
      options,
    )}
  {/if}
  {#if duration.editor.invalidFields}
    <p role="status" class="text-sm">{message('duration.invalidQuantity')}</p>
  {/if}
</div>
