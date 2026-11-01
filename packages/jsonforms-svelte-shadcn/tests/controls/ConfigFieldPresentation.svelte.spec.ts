import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

const mount = (config: Record<string, unknown>, options: Record<string, unknown>) =>
  render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { value: { type: 'string', description: 'Helpful description' } },
        required: ['value'],
      },
      data: { value: 'Original' },
      uischema: { type: 'Control', scope: '#/properties/value', options },
      config,
      renderers: shadcnRenderers,
    },
  });

it.each([
  { config: {}, options: {}, hidden: false },
  { config: { hideRequiredAsterisk: true }, options: {}, hidden: true },
  {
    config: { hideRequiredAsterisk: true },
    options: { hideRequiredAsterisk: false },
    hidden: false,
  },
  {
    config: { hideRequiredAsterisk: false },
    options: { hideRequiredAsterisk: true },
    hidden: true,
  },
])('applies flat and local required-asterisk visibility', async ({ config, options, hidden }) => {
  const view = await mount(config, options);
  await vi.waitFor(() => {
    const asterisk = view.container.querySelector('label span[aria-hidden="true"]');
    expect(Boolean(asterisk)).toBe(!hidden);
    expect(view.container.querySelector<HTMLInputElement>('input[id$="-input"]')?.required).toBe(
      true,
    );
  });
});

it.each([
  { config: {}, options: {}, shown: false },
  { config: { showUnfocusedDescription: true }, options: {}, shown: true },
  {
    config: { showUnfocusedDescription: true },
    options: { showUnfocusedDescription: false },
    shown: false,
  },
  {
    config: { showUnfocusedDescription: false },
    options: { showUnfocusedDescription: true },
    shown: true,
  },
])(
  'applies flat and local unfocused description visibility',
  async ({ config, options, shown }) => {
    const view = await mount(config, options);
    await vi.waitFor(() => {
      expect(Boolean(view.container.querySelector('[role="note"]'))).toBe(shown);
    });
  },
);
