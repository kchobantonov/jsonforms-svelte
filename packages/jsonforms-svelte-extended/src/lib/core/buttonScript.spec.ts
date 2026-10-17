import { expect, it } from 'vitest';
import {
  executeButtonScript,
  normalizeActionParams,
  scriptEvaluationAllowed,
} from './buttonScript';
import type { ActionEvent } from './types';

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
  await expect(
    executeButtonScript('throw new Error("script failed")', {} as ActionEvent, permission),
  ).rejects.toThrow('script failed');
});
it('normalizes non-record parameters without sharing the caller record', () => {
  expect(normalizeActionParams(null)).toEqual({});
  expect(normalizeActionParams(['value'])).toEqual({});
  const params = { value: 0 };
  expect(normalizeActionParams(params)).toEqual(params);
  expect(normalizeActionParams(params)).not.toBe(params);
});
