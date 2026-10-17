<script lang="ts">
  import { Calendar } from '@jsonforms-svelte-shadcn-ui/calendar';
  import type { ComponentProps } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { registerCalendarAnnouncements } from '../../util/calendarAnnouncements';

  let {
    value = $bindable(),
    placeholder = $bindable(),
    ...props
  }: ComponentProps<typeof Calendar> = $props();
  const message = useRendererMessages();
  let root = $state<HTMLDivElement | null>(null);
  $effect(() => {
    const labels = [
      ['[data-calendar-prev-button]', message('calendar.previousMonth')],
      ['[data-calendar-next-button]', message('calendar.nextMonth')],
      ['[data-calendar-month-select]', message('temporal.month')],
      ['[data-calendar-year-select]', message('temporal.year')],
    ];
    const element = root;
    if (!element) return;
    const apply = () => {
      for (const [selector, label] of labels)
        for (const node of element.querySelectorAll(selector)) {
          if (node.getAttribute('aria-label') !== label) node.setAttribute('aria-label', label);
        }
    };
    const observer = new MutationObserver(apply);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
    apply();
    const stopAnnouncements = registerCalendarAnnouncements(element, message);
    return () => {
      observer.disconnect();
      stopAnnouncements();
    };
  });
</script>

<Calendar
  calendarLabel={message('calendar.name')}
  aria-roledescription={message('calendar.pickerRole')}
  {...props}
  bind:value={value as never}
  bind:placeholder
  bind:ref={root}
/>
