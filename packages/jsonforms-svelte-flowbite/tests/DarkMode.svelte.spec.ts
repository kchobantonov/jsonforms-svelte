import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import DarkMode from '../src/lib/components/DarkMode/DarkMode.svelte';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it('names the next mode and keeps its built-in icon decorative', async () => {
  const view = render(DarkMode, { props: { mode: 'light', cycleMode: true } });
  const button = view.container.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe(messages.en['theme.darkMode']);
  await view.getByRole('button').click();
  expect(button.getAttribute('aria-label')).toBe(messages.en['theme.systemMode']);
  await view.getByRole('button').click();
  expect(button.getAttribute('aria-label')).toBe(messages.en['theme.lightMode']);
  expect(view.container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(view.container.querySelector('[role="img"]')).toBeNull();
  await view.rerender({ dark: false });
  expect(button.getAttribute('aria-label')).toBe(messages.en['theme.darkMode']);
  await view.getByRole('button').click();
  expect(button.getAttribute('aria-label')).toBe(messages.en['theme.lightMode']);
});
it('preserves host labels including intentional empty overrides', async () => {
  const view = render(DarkMode, { props: { ariaLabel: 'Changer le thème' } });
  expect(view.container.querySelector('button')?.getAttribute('aria-label')).toBe(
    'Changer le thème',
  );
  await view.rerender({ ariaLabel: '' });
  expect(view.container.querySelector('button')?.getAttribute('aria-label')).toBe('');
});
