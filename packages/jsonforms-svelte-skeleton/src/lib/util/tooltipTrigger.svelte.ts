import { onMount } from 'svelte';

export function useTooltipTrigger(hoverDelay = 0) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let focused = $state(false);
  let hovered = $state(false);
  let dismissed = $state(false);
  function dismissOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') dismissed = true;
  }
  function removeListener() {
    window.removeEventListener('keydown', dismissOnEscape, true);
  }
  onMount(() => () => {
    clearTimeout(timer);
    removeListener();
  });
  function showHover() {
    hovered = true;
    dismissed = false;
  }

  return {
    get open() {
      return (focused || hovered) && !dismissed;
    },
    events: {
      onfocus() {
        focused = true;
        dismissed = false;
        window.addEventListener('keydown', dismissOnEscape, true);
      },
      onblur() {
        focused = false;
        removeListener();
      },
      onpointerenter() {
        clearTimeout(timer);
        if (hoverDelay) timer = setTimeout(showHover, hoverDelay);
        else showHover();
      },
      onpointerleave() {
        clearTimeout(timer);
        hovered = false;
      },
    },
  };
}
