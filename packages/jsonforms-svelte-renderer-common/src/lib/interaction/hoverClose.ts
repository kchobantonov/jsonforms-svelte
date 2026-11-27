import { onDestroy } from 'svelte';

/** Keep a hover panel open while the pointer crosses from its trigger to its contents. */
export function useHoverClose(close: () => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
  }
  function schedule() {
    cancel();
    timer = setTimeout(close, delay);
  }
  onDestroy(cancel);
  return { cancel, schedule };
}
