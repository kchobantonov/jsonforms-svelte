<script lang="ts">
  import { Datepicker, type DatepickerProps } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';

  const props: DatepickerProps = $props();
  const message = useRendererMessages();
  // Flowbite 1.33.1 exposes locale for dates, but no hooks for these native ARIA names.
  // These are upstream attribute identifiers, not renderer translation fallbacks.
  const nativeKeys = new Map([
    ['Calendar', 'calendar.name'],
    ['Next month', 'calendar.nextMonth'],
    ['Previous month', 'calendar.previousMonth'],
    ['Next year', 'calendar.nextYear'],
    ['Previous year', 'calendar.previousYear'],
  ]);
  const labels = $derived(
    Object.fromEntries([...nativeKeys.values()].map((key) => [key, message(key)])),
  );

  function localize(node: HTMLElement, initial: Record<string, string>) {
    let translated = initial;
    const identified = new WeakMap<Element, string>();
    const apply = () => {
      for (const element of node.querySelectorAll('[aria-label]')) {
        const current = element.getAttribute('aria-label')!;
        const key = identified.get(element) ?? nativeKeys.get(current);
        if (!key) continue;
        identified.set(element, key);
        if (current !== translated[key]) element.setAttribute('aria-label', translated[key]);
      }
    };
    const observer = new MutationObserver(apply);
    observer.observe(node, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
    apply();
    return {
      update(next: Record<string, string>) {
        translated = next;
        apply();
      },
      destroy() {
        observer.disconnect();
      },
    };
  }
</script>

<div use:localize={labels}>
  <Datepicker {...props} />
</div>
