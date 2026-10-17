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
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { getPortalTarget } from '@chobantonov/jsonforms-svelte-shadcn';
</script>

{#snippet content()}
  <Select.Trigger aria-label={label} class="w-full"
    >{values.length
      ? choices
          .filter((choice) => values.includes(choice.value))
          .map((choice) => choice.label)
          .join(', ')
      : message(multiple ? 'cron.every' : 'cron.chooseRepeats')}</Select.Trigger
  >
  <Select.Content portalProps={{ to: getPortalTarget() }}
    >{#each choices as choice (choice.value)}<Select.Item value={choice.value} label={choice.label}
        >{choice.label}</Select.Item
      >{/each}</Select.Content
  >
{/snippet}
<div class="grid min-w-0 gap-1">
  <span class="text-sm">{label}</span>
  {#if multiple}<Select.Root type="multiple" value={values} onValueChange={change} {disabled}
      >{@render content()}</Select.Root
    >
  {:else}<Select.Root
      type="single"
      value={values[0] ?? ''}
      onValueChange={(value) => change([value])}
      {disabled}>{@render content()}</Select.Root
    >{/if}
</div>
