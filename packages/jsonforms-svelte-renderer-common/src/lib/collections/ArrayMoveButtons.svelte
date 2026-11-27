<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useArrayTable } from './arrayTable.svelte';
  type Move = ReturnType<typeof useArrayTable>['moveAction'];
  const {
    index,
    move,
    TupleAction,
    Up,
    Down,
    style,
    buttonProps,
  }: {
    index: number;
    move: Move;
    Up: Component<{ class: string }>;
    Down: Component<{ class: string }>;
    style: (direction: 'up' | 'down') => string;
    TupleAction: Component<ReturnType<Move> & { kind: 'add'; buttonClass: string; icon: Snippet }>;
    buttonProps?: Record<string, unknown>;
  } = $props();
</script>

<div class="flex items-center justify-center gap-1">
  {#each ['up', 'down'] as const as direction (direction)}
    {@const Icon = direction === 'up' ? Up : Down}
    <TupleAction
      kind="add"
      {...buttonProps}
      buttonClass={style(direction)}
      {...move(index, direction)}
    >
      {#snippet icon()}<Icon class="h-3 w-3" />{/snippet}
    </TupleAction>
  {/each}
</div>
