import { AsyncFunction, type ActionEvent, type ButtonElement } from './types';

export function scriptEvaluationAllowed(config: unknown): boolean {
  let value = config;
  for (const key of ['jsonformsExtended', 'security', 'allowScriptEvaluation']) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return false;
    value = (value as Record<string, unknown>)[key];
  }
  return value === true;
}

export function normalizeActionParams(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

export type ButtonScriptResult = 'executed' | 'disabled' | 'unavailable';

/** Check host permission before compiling. Trusted callbacks need no runtime compilation. */
export async function executeButtonScript(
  script: NonNullable<ButtonElement['script']>,
  event: ActionEvent,
  config: unknown,
): Promise<ButtonScriptResult> {
  if (typeof script === 'function') {
    await script.call(event, event);
    return 'executed';
  }
  if (!scriptEvaluationAllowed(config)) return 'disabled';
  let compiled;
  try {
    compiled = new AsyncFunction(script);
  } catch (error) {
    // CSP blocks runtime construction with EvalError. Do not try another evaluator.
    if (error instanceof EvalError) return 'unavailable';
    throw error;
  }
  await compiled.call(event);
  return 'executed';
}
