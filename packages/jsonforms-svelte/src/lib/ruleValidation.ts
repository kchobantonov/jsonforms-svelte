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

/** Native/string-adapted rule predicates also receive isolated data. */
export function ruleValidationElement<T extends UISchemaElement>(element: T): T {
  if (!element.rule) return element;
  return {
    ...element,
    rule: { ...element.rule, condition: isolateCondition(element.rule.condition) },
  };
}

function isolateCondition(condition: Condition): Condition {
  if ('conditions' in condition && Array.isArray(condition.conditions)) {
    return { ...condition, conditions: condition.conditions.map(isolateCondition) };
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
