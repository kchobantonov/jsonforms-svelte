import type { DatePickerRootProps } from '@skeletonlabs/skeleton-svelte';
import type { useRendererMessages } from '@chobantonov/jsonforms-svelte';

/** Use the native calendar's translation hooks, including its day and view announcements. */
export function calendarTranslations(
  message: ReturnType<typeof useRendererMessages>,
  overrides?: unknown,
): NonNullable<DatePickerRootProps['translations']> {
  const previous = {
    day: 'calendar.previousMonth',
    month: 'calendar.previousYear',
    year: 'calendar.previousDecade',
  };
  const next = {
    day: 'calendar.nextMonth',
    month: 'calendar.nextYear',
    year: 'calendar.nextDecade',
  };
  const view = { day: 'calendar.yearView', month: 'calendar.dayView', year: 'calendar.monthView' };
  return {
    dayCell: (state) =>
      message(
        state.unavailable
          ? 'calendar.unavailableDate'
          : state.selected
            ? 'calendar.selectedDate'
            : 'calendar.chooseDate',
        { date: state.formattedDate },
      ),
    nextTrigger: (mode) => message(next[mode]),
    prevTrigger: (mode) => message(previous[mode]),
    viewTrigger: (mode) => message(view[mode]),
    presetTrigger: ([start = '', end = '']) => message('calendar.chooseRange', { start, end }),
    trigger: (open) => message(open ? 'calendar.close' : 'calendar.open'),
    content: message('calendar.name'),
    monthSelect: message('temporal.month'),
    yearSelect: message('temporal.year'),
    clearTrigger: message('calendar.clearDates'),
    placeholder: () => ({
      day: message('calendar.dayPlaceholder'),
      month: message('calendar.monthPlaceholder'),
      year: message('calendar.yearPlaceholder'),
    }),
    weekColumnHeader: message('calendar.week'),
    weekNumberCell: (number) => message('calendar.weekNumber', { number }),
    ...(overrides && typeof overrides === 'object' && !Array.isArray(overrides) ? overrides : {}),
  };
}
