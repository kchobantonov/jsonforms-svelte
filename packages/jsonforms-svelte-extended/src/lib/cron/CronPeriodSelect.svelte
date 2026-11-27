<script lang="ts" module>
  export interface CronSelectProps {
    label: string;
    values: string[];
    choices: { value: string; label: string }[];
    multiple: boolean;
    change(values: string[]): void;
    disabled: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  type Attributes = {
    'aria-label': string;
    disabled: boolean;
    value: string;
    onchange: (event: Event & { currentTarget: HTMLSelectElement }) => void;
  };
  const {
    label,
    values,
    choices,
    disabled,
    change,
    select,
  }: Omit<CronSelectProps, 'multiple'> & { select: Snippet<[Attributes, Snippet]> } = $props();
  const message = useRendererMessages();
</script>

{#snippet options()}
  <option value="" disabled>{message('cron.chooseRepeats')}</option>
  {#each choices as choice (choice.value)}<option value={choice.value}>{choice.label}</option
    >{/each}
{/snippet}
{@render select(
  {
    'aria-label': label,
    disabled,
    value: values[0] ?? '',
    onchange: (event) => change([event.currentTarget.value]),
  },
  options,
)}
