import {
  getAjv,
  type JsonFormsState,
  type UISchemaElement,
  type Condition,
  type ValidateFunctionContext,
} from '@jsonforms/core';
import type Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import cloneDeep from 'lodash/cloneDeep';
import { scopeDataSegments } from './schemaScope';
import type { UIDiagnosticReporter } from './authorDiagnostic.svelte';

export type RuleReferenceReporter = (
  condition: Condition,
  reference?: string,
  elementScope?: string,
) => void;

/** Keep warning identity on the authored condition, not a derived rule copy. */
export function createRuleReferenceReporter(
  report: UIDiagnosticReporter,
  path: () => string,
  activeSchema?: () => unknown,
): RuleReferenceReporter {
  let warned = new WeakMap<Condition, Map<string, string>>();
  let previousSchema = activeSchema?.();
  return (condition, reference, elementScope) => {
    if (activeSchema) {
      const currentSchema = activeSchema();
      if (currentSchema !== previousSchema) {
        warned = new WeakMap<Condition, Map<string, string>>();
        previousSchema = currentSchema;
      }
    }
    const currentPath = path();
    const location = JSON.stringify([currentPath, elementScope]);
    if (reference === undefined) {
      warned.get(condition)?.delete(location);
      return;
    }
    let locations = warned.get(condition);
    if (!locations) {
      locations = new Map<string, string>();
      warned.set(condition, locations);
    }
    if (locations.get(location) === reference) return;
    locations.set(location, reference);
    report('rule.referenceFailed', {
      severity: 'warning',
      message: 'The rule schema reference could not be resolved.',
      details: {
        path: currentPath,
        elementScope,
        scope: 'scope' in condition ? condition.scope : undefined,
        reference,
      },
    });
  };
}

const missingReference = (error: unknown): string | undefined =>
  typeof error === 'object' &&
  error !== null &&
  'missingRef' in error &&
  typeof error.missingRef === 'string'
    ? error.missingRef
    : undefined;

const isolatedValidators = new WeakMap<Ajv, Ajv>();
const isolatedFunctions = new WeakMap<ValidateFunction, ValidateFunction>();

function isolateFunction(validate: ValidateFunction): ValidateFunction {
  let isolated = isolatedFunctions.get(validate);
  if (!isolated) {
    isolated = new Proxy(validate, {
      apply(target, receiver, [data, ...rest]) {
        return Reflect.apply(target, receiver, [cloneDeep(data), ...rest]);
      },
    });
    isolatedFunctions.set(validate, isolated);
  }
  return isolated;
}

/**
 * Rule schemas validate a normalized copy, never the live value. Keep the host
 * validator's references, formats and keywords rather than constructing a
 * differently configured validator. Ordinary form validation remains mutating.
 */
export function ruleValidationAjv(ajv: Ajv): Ajv {
  let isolated = isolatedValidators.get(ajv);
  if (!isolated) {
    isolated = new Proxy(ajv, {
      get(target, key) {
        if (key === 'compile') {
          return (...args: Parameters<Ajv['compile']>) => isolateFunction(target.compile(...args));
        }
        if (key === 'getSchema') {
          return (schema: string) => {
            const validate = target.getSchema(schema);
            return validate ? isolateFunction(validate) : undefined;
          };
        }
        if (key === 'validate') {
          return (schema: Parameters<Ajv['validate']>[0], data: unknown) =>
            target.validate(schema, cloneDeep(data));
        }
        return Reflect.get(target, key, target);
      },
    });
    isolatedValidators.set(ajv, isolated);
    isolatedValidators.set(isolated, isolated);
  }
  return isolated;
}

/** Supply this state only to renderer mapping, not to the form reducer. */
export function ruleValidationState(state: JsonFormsState): JsonFormsState {
  if (!state.jsonforms?.core || !getAjv(state)) return state;
  return {
    ...state,
    jsonforms: {
      ...state.jsonforms,
      core: { ...state.jsonforms.core, ajv: ruleValidationAjv(getAjv(state)) },
    },
  };
}

/** Native/string-adapted rule predicates also receive isolated data.
 * Pass the host Ajv to preserve custom keywords and formats for literal scopes.
 */
export function ruleValidationElement<T extends UISchemaElement>(
  element: T,
  ajv: Ajv | undefined,
  pathSegments: readonly string[],
  reportReference?: RuleReferenceReporter,
): T {
  if (!element.rule) return element;
  const exactPath = [...pathSegments];
  const reportForElement: RuleReferenceReporter | undefined = reportReference
    ? (condition, reference) =>
        reportReference(
          condition,
          reference,
          'scope' in element && typeof element.scope === 'string' ? element.scope : undefined,
        )
    : undefined;
  return {
    ...element,
    rule: {
      ...element.rule,
      condition: isolateCondition(element.rule.condition, ajv, exactPath, reportForElement),
    },
  };
}

const literalValueAt = (data: unknown, segments: readonly string[]): unknown =>
  segments.reduce<unknown>(
    (value, segment) =>
      value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
        ? (value as Record<string, unknown>)[segment]
        : undefined,
    data,
  );

function isolateCondition(
  condition: Condition,
  ajv: Ajv | undefined,
  pathSegments: readonly string[],
  reportReference?: RuleReferenceReporter,
): Condition {
  if ('conditions' in condition && Array.isArray(condition.conditions)) {
    return {
      ...condition,
      conditions: condition.conditions.map((child) =>
        isolateCondition(child, ajv, pathSegments, reportReference),
      ),
    };
  }
  if ('scope' in condition && typeof condition.scope === 'string') {
    const segments = scopeDataSegments(condition.scope);
    const validateSchema =
      'schema' in condition && ajv
        ? (value: unknown): boolean => {
            try {
              const valid = ruleValidationAjv(ajv).validate(condition.schema, value) === true;
              reportReference?.(condition, undefined);
              return valid;
            } catch (error) {
              const reference = missingReference(error);
              if (reference === undefined) throw error;
              reportReference?.(condition, reference);
              return false;
            }
          }
        : undefined;
    // Core converts scopes to dot-separated paths before reading data. Preserve
    // literal dotted, empty and repeatedly escaped tilde names by resolving
    // these leaves here. Core's decoder replaces only the first escaped tilde.
    if (
      segments.some((segment) => segment === '' || segment.includes('.') || segment.includes('~'))
    ) {
      if ('schema' in condition && !ajv) return condition;
      return {
        scope: '#',
        validate: (context: ValidateFunctionContext) => {
          // Core's context.path is flattened and cannot distinguish a literal
          // dotted parent from nested members. Capture the dispatch path here.
          const path = [...pathSegments, ...segments];
          if (condition.type === 'LEAF' && 'expectedValue' in condition) {
            return literalValueAt(context.fullData, path) === condition.expectedValue;
          }
          if ('schema' in condition) {
            const value = literalValueAt(context.fullData, path);
            if (condition.failWhenUndefined && value === undefined) return false;
            return validateSchema!(value);
          }
          if ('validate' in condition && typeof condition.validate === 'function') {
            const fullData = cloneDeep(context.fullData);
            return condition.validate.call(condition, {
              ...context,
              data: literalValueAt(fullData, path),
              fullData,
            });
          }
          return true;
        },
      } as Condition;
    }
    if (validateSchema && !('type' in condition && condition.type === 'LEAF')) {
      return {
        scope: condition.scope,
        validate: (context: ValidateFunctionContext) => {
          if (
            'failWhenUndefined' in condition &&
            condition.failWhenUndefined &&
            context.data === undefined
          )
            return false;
          return validateSchema(context.data);
        },
      } as Condition;
    }
  }
  if ('validate' in condition && typeof condition.validate === 'function') {
    const predicate = condition.validate;
    return {
      ...condition,
      validate: (context: ValidateFunctionContext) => {
        const isolated = cloneDeep({ data: context.data, fullData: context.fullData });
        return predicate.call(condition, { ...context, ...isolated });
      },
    };
  }
  return condition;
}
