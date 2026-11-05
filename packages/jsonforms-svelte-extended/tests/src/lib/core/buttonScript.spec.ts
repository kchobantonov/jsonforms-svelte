import { expect, it, vi } from 'vite-plus/test';
import {
  executeButtonScript,
  normalizeActionParams,
  scriptEvaluationAllowed,
} from '../../../../src/lib/core/buttonScript';
import type { ActionEvent } from '../../../../src/lib/core/types';

const permission = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };
it('requires an explicit own host permission before parsing source', async () => {
  expect(scriptEvaluationAllowed(Object.create(permission))).toBe(false);
  expect(
    scriptEvaluationAllowed({ jsonformsExtended: { security: { allowScriptEvaluation: 'true' } } }),
  ).toBe(false);
  expect(await executeButtonScript('invalid syntax !!!', {} as ActionEvent, {})).toBe('disabled');
});
it('awaits string bodies with the action event as this', async () => {
  const event = { params: { complete: false } } as unknown as ActionEvent;
  expect(
    await executeButtonScript(
      'await Promise.resolve(); this.params.complete = true;',
      event,
      permission,
    ),
  ).toBe('executed');
  expect(event.params.complete).toBe(true);
});
it('propagates callback rejection and script errors to the caller', async () => {
  const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const failure = new Error('action failed');
    await expect(
      executeButtonScript(
        async () => {
          throw failure;
        },
        {} as ActionEvent,
        {},
      ),
    ).rejects.toBe(failure);
    expect(diagnostic).not.toHaveBeenCalled();
    const runtimeFailure = new Error('privateRuntimeToken');
    const event = { failure: runtimeFailure } as unknown as ActionEvent;
    await expect(executeButtonScript('throw this.failure', event, permission)).rejects.toBe(
      runtimeFailure,
    );
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith('script.evaluationFailed', {
      severity: 'error',
      message: 'Button script evaluation failed.',
      details: { capability: 'button', phase: 'execute' },
    });
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('privateRuntimeToken');
  } finally {
    diagnostic.mockRestore();
  }
});

it('reports compile errors without logging the source and still rejects', async () => {
  const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(
      executeButtonScript(
        'privateCompileToken invalid JavaScript {',
        {} as ActionEvent,
        permission,
      ),
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith('script.evaluationFailed', {
      severity: 'error',
      message: 'Button script evaluation failed.',
      details: { capability: 'button', phase: 'compile' },
    });
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('privateCompileToken');
  } finally {
    diagnostic.mockRestore();
  }
});
it('reports CSP compilation refusal and returns unavailable', async () => {
  vi.resetModules();
  vi.doMock('../../../../src/lib/core/types', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../../src/lib/core/types')>()),
    AsyncFunction: class {
      constructor() {
        throw new EvalError('privatePolicyToken');
      }
    },
  }));
  const diagnostic = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { executeButtonScript: executeWithCsp } =
      await import('../../../../src/lib/core/buttonScript');
    expect(await executeWithCsp('return 1;', {} as ActionEvent, permission)).toBe('unavailable');
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith('script.evaluationUnavailable', {
      severity: 'warning',
      message: 'Button script evaluation is unavailable in this environment.',
      details: { capability: 'button', phase: 'compile' },
    });
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('privatePolicyToken');
  } finally {
    diagnostic.mockRestore();
    vi.doUnmock('./types');
    vi.resetModules();
  }
});
it('normalizes non-record parameters without sharing the caller record', () => {
  expect(normalizeActionParams(null)).toEqual({});
  expect(normalizeActionParams(['value'])).toEqual({});
  const params = { value: 0 };
  expect(normalizeActionParams(params)).toEqual(params);
  expect(normalizeActionParams(params)).not.toBe(params);
});
