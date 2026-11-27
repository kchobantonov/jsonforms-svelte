<script lang="ts">
  import { Select } from 'flowbite-svelte';
  import {
    calendarMonths,
    calendarYears,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const {
    showMonth,
    date,
    fallbackMonth,
    minimumYear,
    maximumYear,
    locale,
    disabled = false,
    update,
  }: {
    showMonth: boolean;
    date?: Date;
    fallbackMonth: number;
    minimumYear?: number;
    maximumYear?: number;
    locale?: string;
    disabled?: boolean;
    update(value: Date): void;
  } = $props();
  const message = useRendererMessages();
  const year = $derived(date?.getFullYear() ?? new Date().getFullYear());
  const month = $derived(date?.getMonth() ?? fallbackMonth);
  const selectableMonths = $derived(
    calendarMonths(locale, 0).map(({ value, label }) => ({ value: String(value), name: label })),
  );
  const selectableYears = $derived(
    calendarYears(minimumYear, maximumYear, new Date().getFullYear()).map((year) => ({
      value: String(year),
      name: String(year),
    })),
  );
  function updatePart(nextYear: number, nextMonth: number) {
    const day = Math.min(date?.getDate() ?? 1, new Date(nextYear, nextMonth + 1, 0).getDate());
    update(new Date(nextYear, nextMonth, day));
  }
</script>

<div class="grid min-w-64 grid-cols-2 gap-2 p-2">
  {#if showMonth}
    <Select
      placeholder=""
      value={String(month)}
      aria-label={message('temporal.month')}
      {disabled}
      onchange={(event) => updatePart(year, Number(event.currentTarget.value))}
      items={selectableMonths}
    />
  {/if}
  <Select
    placeholder=""
    value={String(year)}
    aria-label={message('temporal.year')}
    {disabled}
    onchange={(event) => updatePart(Number(event.currentTarget.value), month)}
    items={selectableYears}
  />
</div>
