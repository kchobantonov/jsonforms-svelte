<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    label,
    values,
    choices,
    multiple,
    change,
    disabled,
  }: {
    label: string;
    values: string[];
    choices: { value: string; label: string }[];
    multiple: boolean;
    change: (values: string[]) => void;
    disabled: boolean;
  } = $props();
  import { MultiSelect, Select } from 'flowbite-svelte';
</script>

<div class="grid min-w-0 gap-1">
  <span class="text-sm">{label}</span>
  {#if multiple}
    <MultiSelect
      aria-label={label}
      {disabled}
      items={choices.map((choice) => ({ value: choice.value, name: choice.label }))}
      bind:value={() => values, change}
      placeholder={message('cron.every')}
      classes={{ close: 'hidden' }}
    >
      {#snippet children({ item })}<span class="rounded bg-gray-100 px-1 dark:bg-gray-700"
          >{item.name}</span
        >{/snippet}
    </MultiSelect>
  {:else}
    <Select
      placeholder=""
      aria-label={label}
      {disabled}
      value={values[0] ?? ''}
      onchange={(event) => change([event.currentTarget.value])}
    >
      <option value="" disabled>{message('cron.chooseRepeats')}</option>
      {#each choices as choice (choice.value)}<option value={choice.value}>{choice.label}</option
        >{/each}
    </Select>
  {/if}
</div>
