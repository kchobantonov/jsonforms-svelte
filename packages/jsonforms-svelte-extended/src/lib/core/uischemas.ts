import { scriptEvaluationAllowed } from './buttonScript';
import type { UIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';
import {
  NOT_APPLICABLE,
  type JsonFormsUISchemaRegistryEntry,
  type UISchemaElement,
  type UISchemaTester,
  type ValidateFunctionContext,
} from '@jsonforms/core';

type UISchemaRegistryEntryInput = {
  tester: string | UISchemaTester;
  uischema: UISchemaElement;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUiSchemaElement = (value: unknown): value is UISchemaElement =>
  isObject(value) && typeof value.type === 'string';

const permissionCheck = (
  config: Record<string, unknown> | undefined,
  capability: string,
  reportDiagnostic?: UIDiagnosticReporter,
) => {
  let reported = false;
  return () => {
    const allowed = scriptEvaluationAllowed(config);
    if (!allowed && !reported)
      (reportDiagnostic ?? console.warn)('script.evaluationDisabled', {
        severity: 'warning',
        message: 'Script evaluation is disabled by host policy.',
        details: { capability },
      });
    reported = !allowed;
    return allowed;
  };
};

const createTester = (
  source: string,
  index: number,
  config: Record<string, unknown> | undefined,
  reportDiagnostic?: UIDiagnosticReporter,
): UISchemaTester => {
  const permitted = permissionCheck(config, `uischema.tester[${index}]`, reportDiagnostic);
  let reportedFailure = false;
  const reportFailure = (reason: 'invalidResult' | 'exception', actualType?: string) => {
    if (!reportedFailure)
      (reportDiagnostic ?? console.error)('script.evaluationFailed', {
        severity: 'error',
        message: 'UI-schema tester evaluation failed.',
        details: { capability: `uischema.tester[${index}]`, reason, actualType },
      });
    reportedFailure = true;
  };
  return (schema, schemaPath, path) => {
    if (!permitted()) return NOT_APPLICABLE;
    try {
      const tester = new Function(
        'schema',
        'schemaPath',
        'path',
        'NOT_APPLICABLE',
        `const tester = ${source}; return tester(schema, schemaPath, path);`,
      );

      const result = tester(schema, schemaPath, path, NOT_APPLICABLE);

      if (
        result !== NOT_APPLICABLE &&
        (typeof result !== 'number' || !Number.isFinite(result) || result < 0)
      ) {
        reportFailure('invalidResult', typeof result);
        return NOT_APPLICABLE;
      }

      reportedFailure = false;
      return result;
    } catch {
      reportFailure('exception');
      return NOT_APPLICABLE;
    }
  };
};

const createValidateFunction = (
  source: string,
  config: Record<string, unknown> | undefined,
  reportDiagnostic?: UIDiagnosticReporter,
) => {
  const permitted = permissionCheck(config, 'uischema.rule.validate', reportDiagnostic);
  let reportedFailure = false;
  const reportFailure = (reason: 'invalidResult' | 'exception', actualType?: string) => {
    if (!reportedFailure)
      (reportDiagnostic ?? console.error)('script.evaluationFailed', {
        severity: 'error',
        message: 'UI-schema rule evaluation failed.',
        details: { capability: 'uischema.rule.validate', reason, actualType },
      });
    reportedFailure = true;
  };
  return (context: ValidateFunctionContext): boolean => {
    if (!permitted()) return false;
    try {
      const validate = new Function(
        'context',
        `const validate = ${source}; return validate(context);`,
      );
      const result = validate({
        ...context,
        config,
      });

      if (typeof result !== 'boolean') {
        reportFailure('invalidResult', typeof result);
        return false;
      }

      reportedFailure = false;
      return result;
    } catch {
      reportFailure('exception');
      return false;
    }
  };
};

export const resolveUISchemaValidations = (
  uischema: UISchemaElement | undefined,
  config?: Record<string, unknown>,
  reportDiagnostic?: UIDiagnosticReporter,
): UISchemaElement | undefined => {
  if (!uischema) {
    return undefined;
  }

  const transformNode = (node: UISchemaElement): UISchemaElement => {
    const transformed = { ...node } as UISchemaElement & Record<string, unknown>;

    if (
      isObject(transformed.rule) &&
      isObject(transformed.rule.condition) &&
      typeof transformed.rule.condition.validate === 'string'
    ) {
      transformed.rule = {
        ...(transformed.rule as Record<string, unknown>),
        condition: {
          ...(transformed.rule.condition as Record<string, unknown>),
          validate: createValidateFunction(
            transformed.rule.condition.validate,
            config,
            reportDiagnostic,
          ),
        },
      } as typeof transformed.rule;
    }

    if (Array.isArray(transformed.elements)) {
      transformed.elements = transformed.elements.map((element) =>
        isUiSchemaElement(element) ? transformNode(element) : element,
      );
    }

    return transformed;
  };

  return transformNode(uischema);
};

export const parseAndTransformUISchemaRegistryEntries = (
  uischemaRegistryEntries?: readonly UISchemaRegistryEntryInput[],
  config?: Record<string, unknown>,
  reportDiagnostic?: UIDiagnosticReporter,
): JsonFormsUISchemaRegistryEntry[] => {
  return (uischemaRegistryEntries ?? [])
    .map((entry, index) => {
      if (typeof entry.tester === 'string') {
        return {
          tester: createTester(entry.tester, index, config, reportDiagnostic),
          uischema: resolveUISchemaValidations(entry.uischema, config, reportDiagnostic)!,
        };
      }

      if (typeof entry.tester === 'function') {
        return {
          tester: entry.tester as UISchemaTester,
          uischema: resolveUISchemaValidations(entry.uischema, config, reportDiagnostic)!,
        };
      }

      return null;
    })
    .filter((entry) => entry !== null);
};
