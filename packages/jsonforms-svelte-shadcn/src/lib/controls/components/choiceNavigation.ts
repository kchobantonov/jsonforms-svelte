import { tick } from 'svelte';

/** Bits UI scrolls on selection changes. Home and End also reveal an already active option. */
export async function revealChoiceBoundary(event: KeyboardEvent) {
  if (event.key !== 'Home' && event.key !== 'End') return;
  const command = event.currentTarget as HTMLElement;
  await tick();
  const list = command.querySelector<HTMLElement>('[data-slot="command-list"]');
  const option = list?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
  option?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
