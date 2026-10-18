<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import {
    CRON_FIELDS,
    FIELD_RANGE,
    DEFAULT_CRON,
    formatField,
    labelFor,
    parseField,
    type CronPeriod,
  } from '../core/cron';
  import { CRON_PERIODS, type useCron } from '../core/cron.svelte';
  type Choice = { value: string; label: string };
  let {
    model,
    select,
    input,
    button,
  }: {
    model: ReturnType<typeof useCron>;
    select: Snippet<
      [
        {
          label: string;
          values: string[];
          choices: Choice[];
          multiple: boolean;
          change: (values: string[]) => void;
        },
      ]
    >;
    input: Snippet<
      [{ label: string; value: string; invalid?: boolean; change: (value: string) => void }]
    >;
    button: Snippet<[{ label: string; disabled?: boolean; click: () => void }]>;
  } = $props();
  const message = useRendererMessages();
</script>

<div class="grid max-h-[75vh] gap-1.5 overflow-auto p-1" data-cron-picker>
  {@render select({
    label: message('cron.repeats'),
    values: model.period ? [model.period] : [],
    choices: CRON_PERIODS.map((value) => ({ value, label: message(`cron.period.${value}`) })),
    multiple: false,
    change: (values) => {
      if (CRON_PERIODS.includes(values[0] as CronPeriod))
        model.changePeriod(values[0] as CronPeriod);
    },
  })}
  {#each model.shownFields as field (field)}
    {@const value = model.fields[CRON_FIELDS.indexOf(field)] ?? '*'}
    {@const selected = parseField(value, field)}
    {@const range = FIELD_RANGE[field]}
    {#if selected === undefined}
      {@render input({
        label: message(`cron.${field}`),
        value,
        change: (text) => model.changeField(field, text),
      })}
      <p class="text-sm opacity-75">{message('cron.advanced')}</p>
    {:else}
      {@render select({
        label: message(`cron.${field}`),
        values: selected.length === range[1] - range[0] + 1 ? [] : selected.map(String),
        choices: Array.from({ length: range[1] - range[0] + 1 }, (_, index) => {
          const value = range[0] + index;
          return {
            value: String(value),
            label:
              field === 'month' || field === 'dayOfWeek'
                ? message(`cron.value.${field}.${labelFor(value, field)}`)
                : String(value),
          };
        }),
        multiple: true,
        change: (values) => model.changeField(field, formatField(values.map(Number), field)),
      })}
    {/if}
  {/each}
  {@render input({
    label: message('cron.expression'),
    value: model.text,
    invalid: !!model.editedProblem,
    change: model.changeText,
  })}
  {#if model.editedProblem}<p role="alert" class="text-sm">
      {message(`cron.error.${model.editedProblem}`)}
    </p>{/if}
  <span class="sr-only">{DEFAULT_CRON}</span>
  {#if model.showActions}
    <div class="flex justify-end gap-2">
      {@render button({ label: message('cron.cancel'), click: () => model.setOpen(false) })}
      {@render button({
        label: message('cron.ok'),
        disabled: !!model.editedProblem,
        click: model.apply,
      })}
    </div>
  {/if}
</div>
