import '../test.css';
import { createTranslator } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

it('retranslates an existing AJV error in a mounted control without editing data', async () => {
  const data = { name: 'x' };
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { name: { type: 'string', minLength: 5 } } },
      uischema: { type: 'Control', scope: '#/properties/name' },
      data,
      renderers: flowbiteRenderers,
      i18n: { locale: 'en' },
      onchange,
    },
  });
  const feedback = () => view.container.querySelector('[role="alert"]')?.textContent ?? '';
  await expect.poll(feedback).toContain('characters');
  onchange.mockClear();
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect.poll(feedback).toContain('5');
  expect(feedback()).not.toContain('characters');
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: createTranslator((_key, fallback) => fallback),
      translateError: () => 'Host error presentation',
    },
  });
  await expect.poll(feedback).toContain('Host error presentation');
  expect(onchange).not.toHaveBeenCalled();
  expect(data).toEqual({ name: 'x' });
});

it('retranslates a schema-authored error message without replacing the document', async () => {
  const data = { name: 'x' };
  const onchange = vi.fn();
  const i18n = (locale: string, message: string, overrides: Record<string, string> = {}) => ({
    locale,
    translate: createTranslator((key, fallback) =>
      Object.hasOwn(overrides, key)
        ? overrides[key]
        : key === 'error.errorMessage.shortName'
          ? message
          : fallback,
    ),
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 5,
            errorMessage: { minLength: 'shortName' },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/name', i18n: 'profile.name' },
      data,
      renderers: flowbiteRenderers,
      i18n: i18n('en', 'Name is too short'),
      onchange,
    },
  });
  const feedback = () => view.container.querySelector('[role="alert"]')?.textContent ?? '';
  await expect.poll(feedback).toContain('Name is too short');
  onchange.mockClear();
  await view.rerender({ i18n: i18n('bg', 'Името е твърде кратко') });
  await expect.poll(feedback).toContain('Името е твърде кратко');
  await view.rerender({
    i18n: i18n('bg', 'Името е твърде кратко', { 'error.minLength': 'Обща грешка' }),
  });
  await expect.poll(feedback).toContain('Обща грешка');
  await view.rerender({
    i18n: i18n('bg', 'Името е твърде кратко', {
      'error.minLength': 'Обща грешка',
      'profile.name.error.minLength': 'Локална грешка',
    }),
  });
  await expect.poll(feedback).toContain('Локална грешка');
  await view.rerender({ i18n: i18n('bg', 'Името е твърде кратко') });
  await expect.poll(feedback).toContain('Името е твърде кратко');
  expect(onchange).not.toHaveBeenCalled();
  expect(data).toEqual({ name: 'x' });
});
