import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, JsonFormsSubStates } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import MonacoDraftRenderer from './fixtures/MonacoDraftRenderer.svelte';
import MonacoDraftNoStore from './fixtures/MonacoDraftNoStore.svelte';
import type { useMonacoDraft } from '../src/lib/core/monacoDraft.svelte';

afterEach(cleanup);

it('reports a missing error store again after publication is disabled or the target changes', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = await render(MonacoDraftNoStore, {
      props: { path: 'first', propagateErrors: true },
    });
    const calls = () =>
      warning.mock.calls.filter(([code]) => code === 'monaco.errorStoreUnavailable');
    await vi.waitFor(() => expect(calls()).toHaveLength(1));
    await view.rerender({ propagateErrors: false });
    expect(calls()).toHaveLength(1);
    await view.rerender({ propagateErrors: true });
    await vi.waitFor(() => expect(calls()).toHaveLength(2));
    await view.rerender({ path: 'second' });
    await vi.waitFor(() => expect(calls()).toHaveLength(3));
    expect(calls().map(([, details]) => details.path)).toEqual(['first', 'first', 'second']);
  } finally {
    warning.mockRestore();
  }
});

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

it('commits schema-invalid JSON without duplicating its error and retains a later malformed draft', async () => {
  let captured: { draft: ReturnType<typeof useMonacoDraft>; jsonforms: JsonFormsSubStates };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  await render(JsonForms, {
    props: {
      data: { service: 'original', replicas: 1 },
      schema: {
        type: 'object',
        properties: { service: { type: 'string' }, replicas: { type: 'integer', minimum: 1 } },
        required: ['service', 'replicas'],
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          language: 'json',
          convertJson: true,
          validateJsonSchema: true,
          diagnostics: true,
          propagateErrors: true,
          capture: (value: typeof captured) => {
            captured = value;
          },
        },
      },
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(captured!.draft).toBeDefined());
  captured!.draft.updateDiagnostics(0);
  captured!.draft.updateDiagnosticsPending(false);
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));

  captured!.draft.update('{"service":"warehouse","replicas":0}');
  await vi.waitFor(() =>
    expect(captured!.jsonforms.core?.data).toEqual({ service: 'warehouse', replicas: 0 }),
  );
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].errors).toEqual([
      expect.objectContaining({ keyword: 'minimum', instancePath: '/replicas' }),
    ]),
  );
  expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  expect(validity.mock.lastCall?.[0].valid).toBe(false);

  captured!.draft.update('{ malformed');
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
      expect.objectContaining({ keyword: 'editor', message: 'Invalid JSON' }),
    ]),
  );
  expect(captured!.jsonforms.core?.data).toEqual({ service: 'warehouse', replicas: 0 });
  expect(validity.mock.lastCall?.[0].errors).toHaveLength(1);

  captured!.draft.update('{"service":"warehouse","replicas":2}');
  await vi.waitFor(() =>
    expect(captured!.jsonforms.core?.data).toEqual({ service: 'warehouse', replicas: 2 }),
  );
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({
      valid: true,
      errors: [],
      additionalErrors: [],
    }),
  );
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

it.each(
  (['replace', 'relocate'] as const).flatMap((action) =>
    [true, false].map((host) => ({ action, host })),
  ),
)(
  'tracks an object diagnostic subject through $action (host errors: $host)',
  async ({ action, host }) => {
    let draft: ReturnType<typeof useMonacoDraft>;
    let jsonforms: JsonFormsSubStates;
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const hostError = {
      keyword: 'server',
      instancePath: '/host',
      schemaPath: '',
      params: {},
      message: 'Host error',
    };
    const hostErrors = host ? [hostError] : [];
    const value = { name: 'same' };
    const control = {
      type: 'Control',
      scope: '#/properties/first',
      options: {
        language: 'json',
        convertJson: true,
        propagateErrors: true,
        capture: (entry: { draft: typeof draft; jsonforms: JsonFormsSubStates }) => {
          draft = entry.draft;
          jsonforms = entry.jsonforms;
        },
      },
    };
    const view = await render(JsonForms, {
      props: {
        data: { first: value, second: { name: 'same' } },
        schema: {
          type: 'object',
          properties: { first: { type: 'object' }, second: { type: 'object' } },
        },
        uischema: control,
        renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
        additionalErrors: hostErrors,
        onvaliditychange: validity,
      },
    });
    const obsolete = draft!.updateDiagnostics;
    const originalSubject = draft!.subject;
    draft!.update('{ incomplete');
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(hostErrors.length + 1),
    );
    validity.mockClear();
    await view.rerender({
      uischema: { ...control, scope: '#/properties/second' } as ControlElement,
      ...(action === 'relocate' ? { data: { second: jsonforms!.core!.data.first } } : {}),
    });
    expect(validity.mock.calls.some(([event]) => event.pending)).toBe(true);
    if (action === 'replace') {
      await vi.waitFor(() => expect(draft!.subject).toBeGreaterThan(originalSubject));
      expect(draft!.invalid).toBe(false);
      expect(JSON.parse(draft!.text)).toEqual({ name: 'same' });
      obsolete(3);
      await vi.waitFor(() =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual(hostErrors),
      );
      draft!.updateDiagnostics(1);
      await vi.waitFor(() =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(hostErrors.length + 1),
      );
    } else {
      await vi.waitFor(() =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
          ...hostErrors,
          expect.objectContaining({ instancePath: '/second', keyword: 'editor' }),
        ]),
      );
      expect(validity.mock.calls.every(([event]) => !event.valid)).toBe(true);
      expect(draft!.subject).toBe(originalSubject);
      expect(draft!.text).toBe('{ incomplete');
      expect(draft!.invalid).toBe(true);
    }
  },
);

it('includes participating diagnostics from initial load and retains failed validation in schema-aware validity', async () => {
  let draft: ReturnType<typeof useMonacoDraft>;
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  await render(JsonForms, {
    props: {
      data: { name: 'valid' },
      schema: { type: 'object' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          diagnostics: true,
          validateJsonSchema: true,
          propagateErrors: true,
          capture: (entry: { draft: typeof draft }) => {
            draft = entry.draft;
          },
        },
      },
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: true, valid: false }),
  );
  expect(validity.mock.calls.every(([event]) => !event.valid)).toBe(true);
  draft!.updateDiagnostics(0);
  draft!.updateDiagnosticsPending(false);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: true }),
  );
  draft!.updateDiagnosticsPending(true);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: true, valid: false }),
  );
  draft!.updateDiagnosticsFailure();
  draft!.updateDiagnosticsPending(false);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: false }),
  );
  expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
    expect.objectContaining({
      keyword: 'editor',
      message: 'Editor validation could not be completed.',
    }),
  ]);
  draft!.updateDiagnostics(0);
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
});

it('does not leave unsupported language diagnostics pending before the editor is edited', async () => {
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  await render(JsonForms, {
    props: {
      data: { markup: '<p>Ready</p>' },
      schema: { type: 'object', properties: { markup: { type: 'string' } } },
      uischema: {
        type: 'Control',
        scope: '#/properties/markup',
        options: { language: 'html', diagnostics: true, propagateErrors: true },
      },
      renderers: [{ tester: () => 100, renderer: MonacoDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: true }),
  );
  expect(validity.mock.calls.some(([event]) => event.pending)).toBe(false);
});
