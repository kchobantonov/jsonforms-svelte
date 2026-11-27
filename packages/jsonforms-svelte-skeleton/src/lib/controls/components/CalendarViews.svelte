<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { DatePicker } from '@skeletonlabs/skeleton-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  type PickerContext = Parameters<
    NonNullable<ComponentProps<typeof DatePicker.Context>['children']>
  >[0];
  const views = ['day', 'month', 'year'] as const;
  const message = useRendererMessages();
  function viewRows(view: (typeof views)[number], context: PickerContext) {
    if (view === 'day')
      return context().weeks.map((week) => week.map((day) => ({ value: day, label: day.day })));
    if (view === 'month') return context().getMonthsGrid({ columns: 4, format: 'short' });
    return context().getYearsGrid({ columns: 4 });
  }
</script>

{#snippet calendarTable(view: (typeof views)[number], datePicker: PickerContext)}
  <DatePicker.Table
    class="w-full border-collapse"
    aria-roledescription={message(`calendar.${view}ViewRole`)}
  >
    {#if view === 'day'}
      <DatePicker.TableHead>
        <DatePicker.TableRow>
          {#each datePicker().weekDays as weekDay, id (id)}
            <DatePicker.TableHeader
              class="text-surface-600-400 pb-2 text-center text-xs font-medium"
            >
              {weekDay.short}
            </DatePicker.TableHeader>
          {/each}
        </DatePicker.TableRow>
      </DatePicker.TableHead>
    {/if}
    <DatePicker.TableBody>
      {#each viewRows(view, datePicker) as row, index (index)}
        <DatePicker.TableRow>
          {#each row as cell, i (i)}
            <DatePicker.TableCell value={cell.value} class="p-1 text-center align-middle">
              <DatePicker.TableCellTrigger
                class={view === 'day'
                  ? 'hover:preset-tonal data-[selected]:preset-filled-primary-500 data-[today]:preset-outlined-primary-500 rounded-base inline-flex size-9 items-center justify-center text-sm'
                  : 'hover:preset-tonal data-[selected]:preset-filled-primary-500 rounded-base inline-flex h-10 w-full items-center justify-center text-sm'}
              >
                {cell.label}
              </DatePicker.TableCellTrigger>
            </DatePicker.TableCell>
          {/each}
        </DatePicker.TableRow>
      {/each}
    </DatePicker.TableBody>
  </DatePicker.Table>
{/snippet}

{#snippet navigation()}
  <DatePicker.ViewControl class="mb-2 flex items-center gap-2">
    <DatePicker.PrevTrigger
      class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
    />
    <DatePicker.ViewTrigger
      class="hover:preset-tonal rounded-base text-surface-950-50 inline-flex h-8 flex-1 items-center justify-center border-0 bg-transparent px-3 text-sm font-medium shadow-none"
    >
      <DatePicker.RangeText />
    </DatePicker.ViewTrigger>
    <DatePicker.NextTrigger
      class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex h-8 min-h-0 w-8 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
    />
  </DatePicker.ViewControl>
{/snippet}
{#each views as view (view)}
  <DatePicker.View {view}>
    <DatePicker.Context>
      {#snippet children(datePicker)}
        {@render navigation()}
        {@render calendarTable(view, datePicker)}
      {/snippet}
    </DatePicker.Context>
  </DatePicker.View>
{/each}
