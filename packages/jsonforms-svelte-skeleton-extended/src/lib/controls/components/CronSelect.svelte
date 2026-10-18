<script lang="ts">
  import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  import { XIcon } from '@lucide/svelte';
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
  const getRootNode = getPortalRootNodeGetter();
  const collection = $derived(
    useListCollection({
      items: choices,
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
    }),
  );
</script>

<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  {#if multiple}
    <Combobox
      {collection}
      {getRootNode}
      multiple
      value={values}
      {disabled}
      closeOnSelect={false}
      inputValue={choices
        .filter((choice) => values.includes(choice.value))
        .map((choice) => choice.label)
        .join(', ')}
      onValueChange={(details) => {
        if (!disabled) change(details.value);
      }}
      translations={{
        triggerLabel: label,
        clearTriggerLabel: `${message('cron.every')}: ${label}`,
      }}
    >
      <Combobox.Control class="relative min-w-0">
        <Combobox.Input
          class="input h-8 min-w-0 pe-14 text-sm"
          readonly
          aria-label={label}
          placeholder={message('cron.every')}
        />
        {#if values.length}<Combobox.ClearTrigger
            class="absolute end-7 top-0 inline-flex size-8 items-center justify-center"
            aria-label={`${message('cron.every')}: ${label}`}
            title={`${message('cron.every')}: ${label}`}
          >
            <XIcon class="size-3" />
          </Combobox.ClearTrigger>{/if}
        <Combobox.Trigger />
      </Combobox.Control>
      <Portal target={getPortalTarget()}
        ><Combobox.Positioner
          ><Combobox.Content>
            {#each choices as item (item.value)}<Combobox.Item {item}>
                <Combobox.ItemText>{item.label}</Combobox.ItemText><Combobox.ItemIndicator />
              </Combobox.Item>{/each}
          </Combobox.Content></Combobox.Positioner
        ></Portal
      >
    </Combobox>
  {:else}
    <select
      class="select h-8 w-full text-sm"
      aria-label={label}
      {disabled}
      value={values[0] ?? ''}
      onchange={(event) => change([event.currentTarget.value])}
    >
      <option value="" disabled>{message('cron.chooseRepeats')}</option>
      {#each choices as choice (choice.value)}<option value={choice.value}>{choice.label}</option
        >{/each}
    </select>
  {/if}
</div>
