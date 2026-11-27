<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import { Portal, DatePicker } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget } from '../../util';
  import {
    focusPickerOnEscape,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CalendarPartSelects from './CalendarPartSelects.svelte';
  import CalendarViews from './CalendarViews.svelte';
  const {
    id,
    dateMode,
    date,
    children,
    ...options
  }: Omit<ComponentProps<typeof CalendarPartSelects>, 'month' | 'year' | 'showMonth'> & {
    id: string;
    dateMode: string;
    date: { month: number; year: number };
    children: Snippet;
  } = $props();
  const message = useRendererMessages();
  const restoreFocusOnEscape = focusPickerOnEscape(() => `${id}-picker-trigger`);
</script>

<Portal target={getPortalTarget()}>
  <DatePicker.Positioner>
    <DatePicker.Content
      onkeydowncapture={restoreFocusOnEscape}
      aria-roledescription={message('calendar.pickerRole')}
      class="card preset-filled-surface-50-950 z-50 max-h-[min(30rem,var(--available-height,30rem),calc(100dvh-2rem))] w-[22rem] space-y-4 overflow-y-auto p-4 shadow-xl"
    >
      {#if dateMode !== 'date'}<CalendarPartSelects
          {...options}
          month={date.month}
          year={date.year}
          showMonth={dateMode === 'month'}
        />{:else}<CalendarViews />{/if}
      {@render children()}
    </DatePicker.Content></DatePicker.Positioner
  ></Portal
>
