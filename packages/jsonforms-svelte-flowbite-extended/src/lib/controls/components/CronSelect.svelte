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
  import { MultiSelect, Select, CloseButton } from 'flowbite-svelte';
</script>

<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  <div class="relative min-w-0">
    {#if multiple}
      <MultiSelect
        aria-label={label}
        {disabled}
        items={choices.map((choice) => ({ value: choice.value, name: choice.label }))}
        bind:value={() => values, change}
        placeholder={message('cron.every')}
        classes={{
          close: 'hidden',
          placeholder: 'truncate whitespace-nowrap',
          svg: 'absolute end-3 size-3',
          span: 'min-w-0 flex-1 overflow-hidden whitespace-nowrap',
        }}
        class="relative min-h-8 pe-12"
      >
        {#snippet children({ item })}
          {#if String(item.value) === values[0]}
            <span class="block min-w-0 truncate"
              >{choices
                .filter((choice) => values.includes(choice.value))
                .map((choice) => choice.label)
                .join(', ')}</span
            >
          {/if}
        {/snippet}
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
    {#if multiple && values.length}
      <CloseButton
        {disabled}
        class="absolute end-7 top-1/2 -translate-y-1/2"
        title={`${message('cron.every')}: ${label}`}
        ariaLabel={`${message('cron.every')}: ${label}`}
        name={`${message('cron.every')}: ${label}`}
        onclick={() => {
          if (!disabled) change([]);
        }}
      />
    {/if}
  </div>
</div>
