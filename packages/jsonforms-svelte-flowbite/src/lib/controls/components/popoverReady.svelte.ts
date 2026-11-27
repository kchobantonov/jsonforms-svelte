import { onMount, tick } from 'svelte';

/** Flowbite discovers its trigger after the input has mounted. */
export function usePopoverReady() {
  let ready = $state(false);
  onMount(() => {
    let active = true;
    void tick().then(() => {
      if (active) ready = true;
    });
    return () => {
      active = false;
    };
  });
  return {
    get value() {
      return ready;
    },
  };
}
