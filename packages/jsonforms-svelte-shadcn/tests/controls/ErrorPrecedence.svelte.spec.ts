import '../test.css';
import { createTranslator } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib';

afterEach(cleanup);

it('updates mounted field, global and host-translator precedence without editing data', async () => {
  const data = { name: 'x' };
  const onchange = vi.fn();
  const i18n = (locale: string, catalog: Record<string, string>) => ({
    locale,
    translate: createTranslator((key, fallback) => catalog[key] ?? fallback),
    translateError: () => 'Host translator',
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 3, title: 'Name' } },
      },
      uischema: { type: 'Control', scope: '#/properties/name', i18n: 'profile.name' },
      data,
      renderers: shadcnRenderers,
      i18n: i18n('en', { 'profile.name.error.custom': 'Combined English' }),
      onchange,
    },
  });
  const feedback = () => view.container.querySelector('[role="alert"]')?.textContent;
  await expect.poll(feedback).toContain('Combined English');
  onchange.mockClear();
  await view.rerender({
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'profile.name.error.minLength' ? 'Поле: твърде кратко' : fallback,
      ),
    },
  });
  await expect.poll(feedback).toContain('Поле: твърде кратко');
  await view.rerender({
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'error.minLength' ? 'Общо: твърде кратко' : fallback,
      ),
    },
  });
  await expect.poll(feedback).toContain('Общо: твърде кратко');
  await view.rerender({ i18n: i18n('bg', {}) });
  await expect.poll(feedback).toContain('Host translator');
  expect(onchange).not.toHaveBeenCalled();
  expect(data).toEqual({ name: 'x' });
});
