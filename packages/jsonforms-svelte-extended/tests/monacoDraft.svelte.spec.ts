import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsSubStates } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import MonacoDraftRenderer from './fixtures/MonacoDraftRenderer.svelte';
import type { useMonacoDraft } from '../src/lib/core/monacoDraft.svelte';

afterEach(cleanup);

it('keeps malformed drafts, preserves valid edit formatting and publishes only when enabled', async () => {
  let captured: { draft: ReturnType<typeof useMonacoDraft>; jsonforms: JsonFormsSubStates };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const control = {
    type: 'Control',
    scope: '#',
    options: {
      convertJson: true,
      language: 'json',
      propagateErrors: false,
      capture: (value: typeof captured) => {
        captured = value;
      },
    },
  };
  const view = await render(JsonForms, {
    props: {
      data: { name: 'original' },
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      uischema: control,
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(captured!.draft).toBeDefined());
  captured!.draft.update('{ broken');
  await vi.waitFor(() => expect(view.container.querySelector('textarea')?.value).toBe('{ broken'));
  expect(captured!.jsonforms.core?.data).toEqual({ name: 'original' });
  expect(captured!.draft.invalid).toBe(true);
  expect(validity.mock.lastCall?.[0].valid).toBe(true);
  await view.rerender({
    uischema: { ...control, options: { ...control.options, propagateErrors: true } },
    i18n: { locale: 'bg' },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  expect(captured!.draft.text).toBe('{ broken');
  expect(captured!.draft.message).toBe('Невалиден JSON');
  expect(validity.mock.lastCall?.[0].valid).toBe(false);
  captured!.draft.update('{ "name" : "edited" }');
  await vi.waitFor(() => expect(captured!.jsonforms.core?.data).toEqual({ name: 'edited' }));
  expect(captured!.draft.text).toBe('{ "name" : "edited" }');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  captured!.draft.update('{ again');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
  await view.rerender({ uischema: control });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  expect(captured!.draft.text).toBe('{ again');
  await view.rerender({ data: { name: 'replacement' } });
  await vi.waitFor(() => expect(captured!.draft.invalid).toBe(false));
  expect(captured!.draft.text).toContain('replacement');
  await view.rerender({ readonly: true });
  captured!.draft.update('{ "name": "blocked" }');
  expect(captured!.jsonforms.core?.data).toEqual({ name: 'replacement' });
});

it('publishes localized language summaries without replacing host errors or duplicating schema validation', async () => {
  let captured: { draft: ReturnType<typeof useMonacoDraft>; jsonforms: JsonFormsSubStates };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const hostError = {
    keyword: 'server',
    instancePath: '',
    schemaPath: '',
    params: {},
    message: 'Server error',
  };
  const control = {
    type: 'Control',
    scope: '#',
    options: {
      convertJson: false,
      language: 'javascript',
      propagateErrors: true,
      capture: (value: typeof captured) => {
        captured = value;
      },
    },
  };
  const view = await render(JsonForms, {
    props: {
      data: 'code',
      schema: { type: 'string' },
      uischema: control,
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      additionalErrors: [hostError],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(captured!.draft).toBeDefined());
  captured!.draft.updateDiagnostics(2);
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2));
  expect(validity.mock.lastCall?.[0].additionalErrors).toContainEqual(
    expect.objectContaining({ message: 'The editor contains 2 errors.' }),
  );
  await view.rerender({ i18n: { locale: 'bg' } });
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors).toContainEqual(
      expect.objectContaining({ message: 'Редакторът съдържа 2 грешки.' }),
    ),
  );
  captured!.draft.updateDiagnostics(1);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors).toContainEqual(
      expect.objectContaining({ message: 'Редакторът съдържа грешка.' }),
    ),
  );
  await view.rerender({
    uischema: { ...control, options: { ...control.options, validateJsonSchema: true } },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([hostError]));
  await view.rerender({ uischema: control });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2));
  captured!.draft.updateDiagnostics(0);
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([hostError]));
});

it('publishes owned errors under literal bracket keys using core path semantics', async () => {
  let draft: ReturnType<typeof useMonacoDraft>;
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  await render(JsonForms, {
    props: {
      data: { 'code[0]': { name: 'Original' }, code: [{ name: 'Other' }] },
      schema: { type: 'object', properties: { 'code[0]': { type: 'object' } } },
      uischema: {
        type: 'Control',
        scope: '#/properties/code[0]',
        options: {
          convertJson: true,
          language: 'json',
          propagateErrors: true,
          capture: (value: { draft: typeof draft }) => {
            draft = value.draft;
          },
        },
      },
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  draft!.update('{ incomplete');
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
      expect.objectContaining({ instancePath: '/code[0]', keyword: 'editor' }),
    ]),
  );
  draft!.update('{ "name": "Fixed" }');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]));
});
