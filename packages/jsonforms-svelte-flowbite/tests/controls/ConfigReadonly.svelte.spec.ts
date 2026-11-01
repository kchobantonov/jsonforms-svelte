import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { userEvent } from 'vite-plus/test/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';

it('lets an explicit local writable option override schema annotation but not form-wide readonly', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', readOnly: true },
      data: 'Original',
      uischema: { type: 'Control', scope: '#', options: { readonly: false } },
      config: { separateReadonlyFromDisabled: true },
      renderers: flowbiteRenderers,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  expect(input.readOnly).toBe(false);
  await view.rerender({ readonly: true });
  await vi.waitFor(() => expect(input.readOnly).toBe(true));
});

afterEach(cleanup);

it.each([
  { config: {}, options: {}, readonly: false, disabled: false },
  { config: { readOnly: true }, options: {}, readonly: true, disabled: true },
  {
    config: { readonly: true, separateReadonlyFromDisabled: true },
    options: {},
    readonly: true,
    disabled: false,
  },
  {
    config: { readOnly: true, readonly: false, separateReadonlyFromDisabled: true },
    options: {},
    readonly: false,
    disabled: false,
  },
  {
    config: { readonly: true, separateReadonlyFromDisabled: true },
    options: { readonly: false },
    readonly: false,
    disabled: false,
  },
  {
    config: { readonly: false, separateReadonlyFromDisabled: true },
    options: { readOnly: true },
    readonly: true,
    disabled: false,
  },
  {
    config: { readonly: false, separateReadonlyFromDisabled: true },
    options: { readOnly: true, readonly: false },
    readonly: false,
    disabled: false,
  },
])(
  'applies config readOnly/readonly precedence and readonly presentation',
  async ({ config, options, readonly, disabled }) => {
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
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    expect(input).toBeTruthy();
    await vi.waitFor(() => {
      expect(input.readOnly).toBe(readonly);
      expect(input.disabled).toBe(disabled);
    });
    if (readonly) {
      onchange.mockClear();
      input.focus();
      await userEvent.keyboard('Changed');
      expect(input.value).toBe('Original');
      expect(onchange).not.toHaveBeenCalled();
    }
  },
);
