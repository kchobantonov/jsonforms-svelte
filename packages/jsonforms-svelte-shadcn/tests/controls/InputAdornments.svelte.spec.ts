import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountControl } from '../testUtils';

afterEach(cleanup);

it('places localized adornments inside the input boundary without covering clear', async () => {
  const { view } = await mountControl({
    propertySchema: { type: 'string' },
    renderers: shadcnRenderers,
    value: 'Ada',
    options: {
      startAdornment: { kind: 'text', text: 'Name', i18n: 'field.start' },
      endAdornment: {
        kind: 'icon',
        icon: 'information',
        label: 'Help',
        tooltip: 'About this value',
        i18n: 'field.help',
      },
    },
    i18n: {
      locale: 'bg',
      translate: (key: string, fallback?: string) =>
        ({
          'field.start.text': 'Име',
          'field.help.label': 'Помощ',
          'field.help.tooltip': 'За тази стойност',
        })[key as 'field.start.text'] ??
        fallback ??
        key,
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-input-adornments]')).toBeTruthy(),
  );
  const frame = view.container.querySelector('[data-input-adornments]')!;
  expect(frame.querySelector('[data-adornment="start"]')?.textContent).toBe('Име');
  expect(frame.querySelector('[data-adornment="end"]')?.getAttribute('aria-label')).toBe('Помощ');
  const input = frame.querySelector<HTMLInputElement>('input')!;
  expect(input.value).toBe('Ada');
  await vi.waitFor(() =>
    expect(Number.parseFloat(getComputedStyle(input).paddingInlineStart)).toBeGreaterThan(20),
  );
  expect(frame.querySelector('button:not([data-adornment])')).toBeTruthy();
  const help = frame.querySelector('[data-adornment="end"]') as HTMLButtonElement;
  help.focus();
  expect(help.getAttribute('aria-describedby')).toBeTruthy();
  expect(help.querySelector('[role="tooltip"]')?.textContent).toBe('За тази стойност');
});

it('keeps the password reveal button beside the start adornment while editing', async () => {
  const { view } = await mountControl({
    propertySchema: { type: 'string', format: 'password' },
    renderers: shadcnRenderers,
    value: 'secret123',
    options: {
      format: 'password',
      startAdornment: { kind: 'icon', icon: 'lock', label: 'Locked' },
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  const reveal = view.container.querySelector<HTMLButtonElement>('button[aria-pressed]')!;
  await vi.waitFor(() =>
    expect(Number.parseFloat(getComputedStyle(reveal).insetInlineStart)).toBeGreaterThan(8),
  );
  const initialLeft = reveal.getBoundingClientRect().left;

  for (let index = 0; index < 3; index++) {
    input.focus();
    input.select();
    input.value = '';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await tick();
    input.blur();
    await tick();
    expect(Math.abs(reveal.getBoundingClientRect().left - initialLeft)).toBeLessThan(1);
  }
  expect(getComputedStyle(reveal).userSelect).toBe('none');
});
