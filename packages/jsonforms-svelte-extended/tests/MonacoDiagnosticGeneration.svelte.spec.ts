import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type * as Monaco from 'monaco-editor';
import MonacoEditor from '../src/lib/components/MonacoEditor.svelte';

const diagnostics = vi.hoisted(() => ({
  requests: [] as Array<{
    model: Monaco.editor.ITextModel;
    resolve(count: number): void;
    reject(error: Error): void;
  }>,
  dispose: vi.fn(),
}));
vi.mock('../src/lib/components/monaco-api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/components/monaco-api.js')>();
  return {
    ...actual,
    createMonacoDiagnosticReader: () => ({
      supports: () => true,
      read: (model: Monaco.editor.ITextModel) =>
        new Promise<number>((resolve, reject) =>
          diagnostics.requests.push({ model, resolve, reject }),
        ),
      dispose: diagnostics.dispose,
    }),
  };
});
afterEach(cleanup);
beforeEach(() => {
  diagnostics.requests = [];
  diagnostics.dispose.mockClear();
});
const settle = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
async function setup() {
  const changed = vi.fn();
  const pending = vi.fn();
  const failed = vi.fn();
  const view = await render(MonacoEditor, {
    props: {
      value: 'generation original',
      language: 'plaintext',
      validateDiagnostics: true,
      onmarkerschange: changed,
      ondiagnosticspending: pending,
      ondiagnosticserror: failed,
    },
  });
  await vi.waitFor(() => expect(diagnostics.requests.length).toBeGreaterThan(0), {
    timeout: 10000,
  });
  expect(pending).toHaveBeenLastCalledWith(true);
  expect(changed).not.toHaveBeenCalled();
  return { view, changed, pending, failed };
}
it('rejects an older content result while the current generation remains pending', async () => {
  const { view, changed, pending } = await setup();
  const previous = diagnostics.requests.at(-1)!;
  const { monaco } = await import('../src/lib/components/monaco-api.js');
  const editor = monaco.editor.getEditors().find((editor) => editor.getModel() === previous.model)!;
  editor.executeEdits('test', [{ range: new monaco.Range(1, 1, 1, 11), text: 'current' }]);
  await vi.waitFor(() => expect(diagnostics.requests.at(-1)).not.toBe(previous));
  const current = diagnostics.requests.at(-1)!;
  expect(current.model).toBe(previous.model);
  previous.resolve(3);
  await settle();
  expect(changed).not.toHaveBeenCalled();
  expect(pending).toHaveBeenLastCalledWith(true);
  current.resolve(0);
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
  expect(pending).toHaveBeenLastCalledWith(false);
  expect(view.container.querySelector('.monaco-editor')).not.toBeNull();
});
it('rejects a prior target result after the new target has completed', async () => {
  const { view, changed, pending } = await setup();
  const previous = diagnostics.requests.at(-1)!;
  await view.rerender({ value: 'replacement target' });
  await vi.waitFor(() => expect(diagnostics.requests.at(-1)?.model).not.toBe(previous.model));
  const current = diagnostics.requests.at(-1)!;
  current.resolve(0);
  await vi.waitFor(() => expect(pending).toHaveBeenLastCalledWith(false));
  changed.mockClear();
  pending.mockClear();
  previous.resolve(4);
  await settle();
  expect(changed).not.toHaveBeenCalled();
  expect(pending).not.toHaveBeenCalled();
  expect(previous.model.isDisposed()).toBe(true);
});
it('disposes its validator and ignores completion after unmount', async () => {
  const { view, changed, pending, failed } = await setup();
  const request = diagnostics.requests.at(-1)!;
  await view.unmount();
  changed.mockClear();
  pending.mockClear();
  failed.mockClear();
  request.resolve(2);
  await settle();
  expect(diagnostics.dispose).toHaveBeenCalledOnce();
  expect(changed).not.toHaveBeenCalled();
  expect(pending).not.toHaveBeenCalled();
  expect(failed).not.toHaveBeenCalled();
});
it('reports current validation failure instead of treating it as a clean result', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { changed, pending, failed } = await setup();
    diagnostics.requests.at(-1)!.reject(new Error('worker unavailable'));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledOnce());
    expect(changed).toHaveBeenLastCalledWith(1);
    expect(pending).toHaveBeenLastCalledWith(false);
    expect(warn).toHaveBeenCalledWith('monaco.diagnosticValidationFailed', {
      severity: 'warning',
      message: 'Monaco diagnostic validation failed; the draft remains invalid.',
      details: { language: 'plaintext' },
    });
  } finally {
    warn.mockRestore();
  }
});

it('reports one author warning per active validation failure interval', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { view, changed, failed } = await setup();
    const first = diagnostics.requests.at(-1)!;
    first.reject(new Error('first worker failure'));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    await view.rerender({ value: 'still unavailable' });
    await vi.waitFor(() => expect(diagnostics.requests.at(-1)).not.toBe(first));
    const second = diagnostics.requests.at(-1)!;
    second.reject(new Error('second worker failure'));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(2));
    expect(
      warn.mock.calls.filter(([code]) => code === 'monaco.diagnosticValidationFailed'),
    ).toHaveLength(1);
    await view.rerender({ value: 'recovered' });
    await vi.waitFor(() => expect(diagnostics.requests.at(-1)).not.toBe(second));
    const clean = diagnostics.requests.at(-1)!;
    clean.resolve(0);
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
    await view.rerender({ value: 'failed again' });
    await vi.waitFor(() => expect(diagnostics.requests.at(-1)).not.toBe(clean));
    diagnostics.requests.at(-1)!.reject(new Error('third worker failure'));
    await vi.waitFor(() =>
      expect(
        warn.mock.calls.filter(([code]) => code === 'monaco.diagnosticValidationFailed'),
      ).toHaveLength(2),
    );
  } finally {
    warn.mockRestore();
  }
});
