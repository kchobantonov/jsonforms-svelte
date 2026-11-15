import { AsyncFunction, type ActionEvent, type ButtonElement } from './types';
import type { UIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';

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
  reportDiagnostic?: UIDiagnosticReporter,
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
    if (error instanceof EvalError) {
      (reportDiagnostic ?? console.warn)('script.evaluationUnavailable', {
        severity: 'warning',
        message: 'Button script evaluation is unavailable in this environment.',
        details: { capability: 'button', phase: 'compile' },
      });
      return 'unavailable';
    }
    (reportDiagnostic ?? console.error)('script.evaluationFailed', {
      severity: 'error',
      message: 'Button script evaluation failed.',
      details: { capability: 'button', phase: 'compile' },
    });
    throw error;
  }
  try {
    await compiled.call(event);
  } catch (error) {
    (reportDiagnostic ?? console.error)('script.evaluationFailed', {
      severity: 'error',
      message: 'Button script evaluation failed.',
      details: { capability: 'button', phase: 'execute' },
    });
    throw error;
  }
  return 'executed';
}
