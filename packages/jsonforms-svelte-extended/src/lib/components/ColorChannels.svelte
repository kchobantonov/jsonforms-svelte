<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import type { useColorPicker } from '../core/colorPicker.svelte';
  let {
    model,
    errorClass,
    input,
    select,
  }: {
    errorClass: string;
    model: ReturnType<typeof useColorPicker>;
    input: Snippet<
      [
        {
          label: string;
          value: string;
          type: 'text' | 'number';
          max?: number;
          change(value: string): void;
        },
      ]
    >;
    select: Snippet<
      [
        {
          label: string;
          value: string;
          choices: { value: string; label: string }[];
          change(value: string): void;
        },
      ]
    >;
  } = $props();
  const message = useRendererMessages();
</script>

<div class="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_3.5rem] items-end gap-1" data-color-channels>
  {@render select({
    label: message('color.channelView'),
    value: model.view,
    choices: ['hex', 'rgb', 'hsb'].map((value) => ({
      value,
      label: message(`color.view.${value}`),
    })),
    change: model.setView,
  })}
  {#if model.view === 'hex'}
    {@render input({
      label: message('color.hex'),
      value: model.field('hex'),
      type: 'text',
      change: (value) => model.input('hex', value),
    })}
  {:else}
    <div class="grid min-w-0 grid-cols-3 items-end gap-1">
      {#each model.view === 'rgb' ? ['r', 'g', 'b'] : ['h', 's', 'b'] as key, index (key)}
        {@render input({
          label: message(`color.${model.view}.${key}`),
          value: model.field(key),
          type: 'number',
          max: model.view === 'rgb' ? 255 : index === 0 ? 360 : 100,
          change: (value) => model.input(key, value),
        })}
      {/each}
    </div>
  {/if}
  {@render input({
    label: message('color.alpha'),
    value: model.field('alpha'),
    type: 'number',
    max: 100,
    change: (value) => model.input('alpha', value),
  })}
  {#if model.problem}<p role="alert" class={['col-span-3 text-sm', errorClass]}>
      {message(`color.${model.problem}`)}
    </p>{/if}
</div>
