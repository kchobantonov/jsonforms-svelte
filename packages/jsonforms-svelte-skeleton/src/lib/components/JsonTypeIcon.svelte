<script lang="ts">
  interface Props {
    type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
    active?: boolean;
    class?: string;
  }

  let { type, active = false, class: className = '' }: Props = $props();

  const colorClass = $derived(active ? 'text-white' : 'text-gray-500 dark:text-gray-400');

  const baseClass = $derived(
    `h-4 w-4 shrink-0 fill-none stroke-current ${colorClass} ${className}`,
  );
</script>

<svg
  class={baseClass}
  viewBox="0 0 24 24"
  stroke-width="2.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if type === 'object'}
    <path
      d="M8 3c-1.5 0-3 1-3 3v3c0 1.5-1 2-2 2 1 0 2 .5 2 2v3c0 2 1.5 3 3 3M16 3c1.5 0 3 1 3 3v3c0 1.5 1 2 2 2-1 0-2 .5-2 2v3c0 2-1.5 3-3 3"
    />
  {:else if type === 'array'}
    <path d="M8 4H5v16h3M16 4h3v16h-3" />
  {:else if type === 'string'}
    <path fill="none" stroke="currentColor" stroke-width="2" d="M7 8h10M7 12h10M7 16h6" />
  {:else if type === 'number' || type === 'integer'}
    <g fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 4v16M15 4v16" />
      <path d="M4 9h16M4 15h16" />
    </g>
  {:else if type === 'boolean'}
    <path d="M4 12l5 5L20 7" stroke-width="3" />
  {:else if type === 'null'}
    <circle cx="12" cy="12" r="9" stroke-width="2" />
    <path d="M18.5 5.5l-13 13" stroke-width="2" />
  {/if}
</svg>
