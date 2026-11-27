<script lang="ts">
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  const form = useJsonForms();
  import { currentDate } from './currentPickerDate';
  import {
    calendarMonths,
    calendarYears,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const {
    showMonth,
    month,
    year,
    bounds,
    disabled = false,
    update,
  }: {
    showMonth: boolean;
    month: number;
    year: number;
    bounds: { pickerMin?: { year: number }; pickerMax?: { year: number } };
    disabled?: boolean;
    update(part: 'month' | 'year', value: number): void;
  } = $props();
  const selectableMonths = $derived(calendarMonths(form.i18n?.locale, 1));
  const selectableYears = $derived(
    calendarYears(bounds.pickerMin?.year, bounds.pickerMax?.year, currentDate().year),
  );
  const message = useRendererMessages();
</script>

<div class="grid grid-cols-2 gap-2">
  {#if showMonth}
    <select
      class="select"
      {disabled}
      value={String(month)}
      aria-label={message('temporal.month')}
      onchange={(event) => update('month', Number(event.currentTarget.value))}
    >
      {#each selectableMonths as month (month.value)}
        <option value={String(month.value)}>{month.label}</option>
      {/each}
    </select>
  {/if}
  <select
    class="select"
    {disabled}
    value={String(year)}
    aria-label={message('temporal.year')}
    onchange={(event) => update('year', Number(event.currentTarget.value))}
  >
    {#each selectableYears as year (year)}
      <option value={String(year)}>{year}</option>
    {/each}
  </select>
</div>
