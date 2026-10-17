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
</script>

<div class="grid min-w-0 gap-1">
  <span class="text-sm">{label}</span>
  <select
    class="select w-full"
    aria-label={label}
    {multiple}
    {disabled}
    size={multiple ? 4 : undefined}
    onchange={(event) =>
      change(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
  >
    {#if !multiple}<option value="" disabled selected={!values.length}
        >{message('cron.chooseRepeats')}</option
      >{/if}
    {#each choices as choice (choice.value)}<option
        value={choice.value}
        selected={values.includes(choice.value)}>{choice.label}</option
      >{/each}
  </select>
</div>
