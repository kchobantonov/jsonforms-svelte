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
import { dataPathSegments } from './dataPath';
import { scopeDataSegments } from './schemaScope';

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
export function ruleValidationElement<T extends UISchemaElement>(element: T, ajv?: Ajv): T {
  if (!element.rule) return element;
  return {
    ...element,
    rule: { ...element.rule, condition: isolateCondition(element.rule.condition, ajv) },
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

function isolateCondition(condition: Condition, ajv?: Ajv): Condition {
  if ('conditions' in condition && Array.isArray(condition.conditions)) {
    return {
      ...condition,
      conditions: condition.conditions.map((child) => isolateCondition(child, ajv)),
    };
  }
  if ('scope' in condition && typeof condition.scope === 'string') {
    const segments = scopeDataSegments(condition.scope);
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
          const path = [...dataPathSegments(context.path ?? ''), ...segments];
          if (condition.type === 'LEAF' && 'expectedValue' in condition) {
            return literalValueAt(context.fullData, path) === condition.expectedValue;
          }
          if ('schema' in condition) {
            const value = literalValueAt(context.fullData, path);
            if (condition.failWhenUndefined && value === undefined) return false;
            return ruleValidationAjv(ajv!).validate(condition.schema, value) === true;
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
