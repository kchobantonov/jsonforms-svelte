import type { Translator } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import MonacoEditor from '../src/lib/components/MonacoEditor.svelte';

vi.mock('../src/lib/components/monaco-api.js', () => ({
  monaco: {},
  ensureMonacoWorkers: () => {
    throw new Error('Simulated initialization failure');
  },
  syncMonacoFallbackTheme: () => undefined,
}));
afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

it('shows a translated initialization failure without an unhandled rejection or data change', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: 'preserved code', locale: 'en', onvaluechange: changed },
  });
  await expect
    .element(page.getByRole('alert'))
    .toMatchTextContent('The code editor could not be loaded.');
  expect(view.container.querySelector('[aria-busy="false"]')).not.toBeNull();
  expect(changed).not.toHaveBeenCalled();
  expect(warning).toHaveBeenCalledWith('[jsonforms] editor.loadError', expect.any(Error));
  await view.rerender({ locale: 'bg' });
  await expect
    .element(page.getByRole('alert'))
    .toMatchTextContent('Редакторът на код не можа да се зареди.');
  await view.rerender({
    locale: 'fr',
    translator: ((key, fallback) =>
      key === 'editor.loadError' ? 'Éditeur indisponible' : fallback) as Translator,
  });
  await expect.element(page.getByRole('alert')).toMatchTextContent('Éditeur indisponible');
  await expect.element(page.getByRole('button')).toBeDisabled();
});
