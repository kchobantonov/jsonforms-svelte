import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

const mount = (
  config: Record<string, unknown>,
  options: Record<string, unknown>,
  value = 'Existing',
) => {
  const onchange = vi.fn();
  return render(JsonForms, {
    props: {
      schema: { type: 'string' },
      data: value,
      uischema: { type: 'Control', scope: '#', options },
      config,
      renderers: flowbiteRenderers,
      onchange,
    },
  }).then((view) => ({ view, onchange }));
};

it.each([
  { config: { placeholder: 'Global' }, options: {}, expected: 'Global' },
  { config: { placeholder: 'Global' }, options: { placeholder: 'Local' }, expected: 'Local' },
  { config: { placeholder: 'Global' }, options: { placeholder: '' }, expected: '' },
])('applies flat and local text placeholder precedence', async ({ config, options, expected }) => {
  const { view } = await mount(config, options);
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  expect(input.placeholder).toBe(expected);
});

it.each([
  { config: {}, options: {}, visible: true },
  { config: { clearable: false }, options: {}, visible: false },
  { config: { clearable: false }, options: { clearable: true }, visible: true },
  { config: { clearable: true }, options: { clearable: false }, visible: false },
])('applies flat and local clearable precedence', async ({ config, options, visible }) => {
  const { view } = await mount(config, options);
  await vi.waitFor(() =>
    expect(Boolean(view.container.querySelector('button[aria-label="Clear value"]'))).toBe(visible),
  );
});

it('retains literal whitespace when the legacy trim flag is true', async () => {
  const { view, onchange } = await mount({ trim: true }, {});
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = '  spaced  ';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('  spaced  '));
});
