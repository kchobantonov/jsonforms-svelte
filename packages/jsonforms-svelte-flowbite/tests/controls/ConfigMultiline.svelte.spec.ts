import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

it.each([
  { config: {}, options: {}, multi: false },
  { config: { multi: true }, options: {}, multi: true },
  { config: { multi: true }, options: { multi: false }, multi: false },
  { config: { multi: false }, options: { multi: true }, multi: true },
  { config: { multi: 'true' }, options: {}, multi: false },
])(
  'selects a multiline text surface from merged config and local options',
  async ({ config, options, multi }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string' },
        data: 'Original',
        uischema: { type: 'Control', scope: '#', options },
        config,
        renderers: flowbiteRenderers,
        onchange,
      },
    });
    await vi.waitFor(() =>
      expect(Boolean(view.container.querySelector('textarea[id$="-input"]'))).toBe(multi),
    );
    const field = view.container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      '[id$="-input"]',
    )!;
    expect(field).toBeTruthy();
    field.value = 'Edited\ntext';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toBe(multi ? 'Edited\ntext' : 'Editedtext'),
    );
  },
);
