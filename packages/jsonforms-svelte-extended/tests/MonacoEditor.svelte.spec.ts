import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MonacoEditor from '../src/lib/components/MonacoEditor.svelte';

const editorElement = () =>
  document.querySelector<HTMLElement>('.jsonforms-monaco-editor .monaco-editor');

const renderedTokens = () =>
  Array.from(editorElement()?.querySelectorAll<HTMLElement>('.view-line span span') ?? []).map(
    (token) => (token.textContent ?? '').replaceAll('\u00a0', ' '),
  );

afterEach(() => {
  document.documentElement.removeAttribute('data-mode');
  document.documentElement.style.removeProperty('color-scheme');
});

describe('MonacoEditor', () => {
  it('uses a complete dark theme and reacts to language changes', async () => {
    document.documentElement.setAttribute('data-mode', 'dark');
    const value = "const greeting = 'Hello';";
    const view = await render(MonacoEditor, {
      props: {
        value,
        language: 'javascript',
        rows: 3,
        surfaceBackground: '#fff',
        darkSurfaceBackground: '#1e2939',
      },
    });

    await vi.waitFor(
      () => {
        expect(editorElement()?.classList.contains('vs-dark')).toBe(true);
        expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(30, 41, 57)');
        expect(renderedTokens()).toContain('const');
      },
      { timeout: 10_000 },
    );

    await view.rerender({
      value,
      language: 'json',
      rows: 3,
      surfaceBackground: '#fff',
      darkSurfaceBackground: '#1e2939',
    });

    await vi.waitFor(() => {
      expect(renderedTokens()).toEqual([value]);
    });

    document.documentElement.removeAttribute('data-mode');
    document.documentElement.style.colorScheme = 'light';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(255, 255, 255)');
    });

    document.documentElement.style.colorScheme = 'dark';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--dark'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(30, 41, 57)');
    });

    document.documentElement.style.colorScheme = 'light';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(255, 255, 255)');
    });
  });

  it('treats removal of the dark class as light for class-based themes', async () => {
    document.documentElement.classList.add('dark');
    const view = await render(MonacoEditor, {
      props: {
        value: 'value',
        darkClassBasedTheme: true,
      },
    });

    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--dark'),
      ).toBe(true);
    });

    document.documentElement.classList.remove('dark');
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
    });

    await view.unmount();
  });
});

describe('Monaco schema ownership', () => {
  it('validates section references per model and cleans only its own schemas and models', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const defaults = monaco.json.jsonDefaults;
    const original = defaults.diagnosticsOptions;
    const hostModel = monaco.editor.createModel('"host"', 'json');
    const hostSchema = {
      uri: 'inmemory://host-schema.json',
      fileMatch: [hostModel.uri.toString()],
      schema: { type: 'string' },
    };
    defaults.setDiagnosticsOptions({
      ...original,
      schemas: [...(original.schemas ?? []), hostSchema],
    });
    const schema = {
      type: 'object',
      properties: { count: { $ref: '#/definitions/positive~1count' } },
    };
    const rootSchema = { definitions: { 'positive/count': { type: 'integer', minimum: 1 } } };
    const first = await render(MonacoEditor, {
      props: {
        value: '{"count":0}',
        language: 'json',
        schema,
        rootSchema,
        validateJsonSchema: true,
      },
    });
    const second = await render(MonacoEditor, {
      props: {
        value: '{"count":2}',
        language: 'json',
        schema,
        rootSchema,
        validateJsonSchema: true,
      },
    });
    let firstMounted = true;
    let secondMounted = true;
    try {
      await vi.waitFor(
        () =>
          expect(
            monaco.editor.getModels().filter((model) => model.getValue().startsWith('{"count":')),
          ).toHaveLength(2),
        { timeout: 10000 },
      );
      const firstModel = monaco.editor
        .getModels()
        .find((model) => model.getValue() === '{"count":0}')!;
      const secondModel = monaco.editor
        .getModels()
        .find((model) => model.getValue() === '{"count":2}')!;
      await vi.waitFor(
        () =>
          expect(
            monaco.editor
              .getModelMarkers({ resource: firstModel.uri })
              .some((marker) => /minimum.*1/i.test(marker.message)),
          ).toBe(true),
        { timeout: 10000 },
      );
      expect(monaco.editor.getModelMarkers({ resource: secondModel.uri })).toEqual([]);
      await first.rerender({
        rootSchema: { definitions: { 'positive/count': { type: 'integer', minimum: 3 } } },
      });
      await vi.waitFor(
        () =>
          expect(
            monaco.editor
              .getModelMarkers({ resource: firstModel.uri })
              .some((marker) => /minimum.*3/i.test(marker.message)),
          ).toBe(true),
        { timeout: 10000 },
      );
      expect(monaco.editor.getModelMarkers({ resource: secondModel.uri })).toEqual([]);
      await first.unmount();
      firstMounted = false;
      expect(firstModel.isDisposed()).toBe(true);
      expect(secondModel.isDisposed()).toBe(false);
      expect(hostModel.isDisposed()).toBe(false);
      expect(
        defaults.diagnosticsOptions.schemas?.some((entry) =>
          entry.fileMatch?.includes(firstModel.uri.toString()),
        ),
      ).toBe(false);
      expect(
        defaults.diagnosticsOptions.schemas?.some((entry) =>
          entry.fileMatch?.includes(secondModel.uri.toString()),
        ),
      ).toBe(true);
      await second.unmount();
      secondMounted = false;
      expect(defaults.diagnosticsOptions.schemas).toContainEqual(hostSchema);
    } finally {
      if (firstMounted) await first.unmount();
      if (secondMounted) await second.unmount();
      hostModel.dispose();
      defaults.setDiagnosticsOptions(original);
    }
  });
});

it('reports only errors from its own model and disposes marker subscriptions', async () => {
  const { monaco } = await import('../src/lib/components/monaco-api.js');
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: 'owned-marker-test', language: 'plaintext', onmarkerschange: changed },
  });
  await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(0));
  const model = monaco.editor
    .getModels()
    .find((entry) => entry.getValue() === 'owned-marker-test')!;
  const foreign = monaco.editor.createModel('foreign', 'plaintext');
  const marker = {
    severity: monaco.MarkerSeverity.Error,
    message: 'invalid',
    startLineNumber: 1,
    endLineNumber: 1,
    startColumn: 1,
    endColumn: 2,
  };
  try {
    monaco.editor.setModelMarkers(model, 'test', [
      marker,
      { ...marker, severity: monaco.MarkerSeverity.Warning },
    ]);
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(1));
    monaco.editor.setModelMarkers(foreign, 'test', [marker, marker]);
    monaco.editor.setModelMarkers(model, 'test', []);
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
    expect(changed.mock.calls.every(([count]) => count === 0 || count === 1)).toBe(true);
    await view.unmount();
    changed.mockClear();
    monaco.editor.setModelMarkers(foreign, 'test', []);
    // A subsequent marker event must not invoke the destroyed editor's callback.
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(changed).not.toHaveBeenCalled();
    expect(model.isDisposed()).toBe(true);
  } finally {
    foreign.dispose();
  }
});

it('retracts language diagnostics when switching to a language without validation', async () => {
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: '{ "broken": }', language: 'json', onmarkerschange: changed },
  });
  await vi.waitFor(() => expect(changed.mock.lastCall?.[0]).toBeGreaterThan(0), { timeout: 10000 });
  await view.rerender({ language: 'markdown' });
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
});

it('preserves worker providers installed by the host application', async () => {
  const { ensureMonacoWorkers } = await import('../src/lib/components/monaco-api.js');
  const target = globalThis as typeof globalThis & {
    MonacoEnvironment?: import('monaco-editor').Environment;
  };
  const previous = target.MonacoEnvironment;
  try {
    const getWorker = vi.fn();
    target.MonacoEnvironment = { getWorker };
    ensureMonacoWorkers();
    expect(target.MonacoEnvironment.getWorker).toBe(getWorker);
    const getWorkerUrl = () => '/host-worker.js';
    target.MonacoEnvironment = { getWorkerUrl };
    ensureMonacoWorkers();
    expect(target.MonacoEnvironment.getWorkerUrl).toBe(getWorkerUrl);
    expect(target.MonacoEnvironment.getWorker).toBeUndefined();
  } finally {
    target.MonacoEnvironment = previous;
  }
});
