// Adapted from React renderer-common conditionalFields at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
import { Resolve, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import type Ajv from 'ajv';
import { literalPropertySchema } from './literalPropertySchema';
import { ruleValidationAjv } from './ruleValidation';

type Schema = {
  $ref?: string;
  properties?: Record<string, JsonSchema | boolean>;
  required?: string[];
  allOf?: Schema[];
  if?: JsonSchema | boolean;
  then?: Schema;
  else?: Schema;
  dependencies?: Record<string, Schema | string[]>;
};
export const conditionalFieldsEnabled = (ui: UISchemaElement, config: unknown): boolean =>
  (ui.options?.conditionalFields ??
    (config as { jsonformsExtended?: { conditionalFields?: unknown } } | undefined)
      ?.jsonformsExtended?.conditionalFields) === true;

export function hasConditionalFields(input: unknown, seen = new Set<object>()): boolean {
  if (!input || typeof input !== 'object' || seen.has(input)) return false;
  seen.add(input);
  const schema = input as Schema;
  return (
    (schema.if !== undefined && (schema.then !== undefined || schema.else !== undefined)) ||
    Object.keys(schema.dependencies ?? {}).length > 0 ||
    (schema.allOf ?? []).some((part) => hasConditionalFields(part, seen))
  );
}

const validators = new WeakMap<Ajv, WeakMap<object, WeakMap<object, ReturnType<Ajv['compile']>>>>();
function evaluate(ajv: Ajv, condition: JsonSchema | boolean, root: JsonSchema, data: unknown) {
  if (typeof condition === 'boolean') return condition;
  let roots = validators.get(ajv);
  if (!roots) validators.set(ajv, (roots = new WeakMap()));
  let conditions = roots.get(root);
  if (!conditions) roots.set(root, (conditions = new WeakMap()));
  let validate = conditions.get(condition);
  if (!validate) {
    validate = ruleValidationAjv(ajv).compile(literalPropertySchema(condition, root));
    conditions.set(condition, validate);
  }
  return Boolean(validate(data));
}

/** Presentation only: the form continues to validate the original schema. */
export function projectConditionalFields(
  schema: JsonSchema,
  root: JsonSchema,
  data: unknown,
  ajv: Ajv,
) {
  const properties: Record<string, JsonSchema | boolean> = Object.create(null);
  const known = new Set<string>();
  const required = new Set<string>();
  const diagnostics = new Set<string>();
  const activePath = new Set<object>();
  const visit = (input: unknown, active: boolean) => {
    if (!input || typeof input !== 'object' || activePath.has(input)) return;
    activePath.add(input);
    const current = input as Schema;
    if (current.$ref) {
      try {
        const resolved = Resolve.schema(root, current.$ref, root);
        if (!resolved) diagnostics.add('conditional.referenceFailed');
        else visit(resolved, active);
      } catch {
        diagnostics.add('conditional.referenceFailed');
      }
    }
    for (const [name, value] of Object.entries(current.properties ?? {})) {
      known.add(name);
      if (active) {
        const previous = properties[name];
        properties[name] =
          previous === undefined
            ? value
            : ({
                ...(typeof previous === 'object' ? previous : {}),
                ...(typeof value === 'object' ? value : {}),
                allOf: [previous, value],
              } as JsonSchema);
      }
    }
    if (active) for (const name of current.required ?? []) required.add(name);
    for (const part of current.allOf ?? []) visit(part, active);
    if (current.if !== undefined) {
      let matches: boolean | undefined;
      if (active) {
        try {
          matches = evaluate(ajv, current.if, root, data);
        } catch {
          diagnostics.add('conditional.evaluationFailed');
        }
      }
      visit(current.then, active && matches === true);
      visit(current.else, active && matches === false);
    }
    for (const [name, dependency] of Object.entries(current.dependencies ?? {})) {
      const present =
        active && data !== null && typeof data === 'object' && Object.hasOwn(data, name);
      if (Array.isArray(dependency)) {
        if (present) for (const field of dependency) required.add(field);
      } else visit(dependency, present);
    }
    activePath.delete(input);
  };
  visit(schema, true);
  const projected = { ...schema, properties, required: [...required] } as JsonSchema & Schema;
  for (const key of ['$ref', 'if', 'then', 'else', 'dependencies', 'allOf'] as const)
    delete projected[key];
  return { schema: projected as JsonSchema, known, diagnostics: [...diagnostics] };
}

/** Retain authored placement and base fields, omitting only inactive branch bindings. */
export function conditionalLayout(
  ui: UISchemaElement,
  schema: JsonSchema,
  known: Set<string>,
): UISchemaElement {
  if (!known.size) return ui;
  const visit = (element: UISchemaElement): UISchemaElement | undefined => {
    const scoped = element as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
    const match =
      element.type === 'Control' && /^#\/properties\/([^/]*)(?:\/|$)/.exec(scoped.scope ?? '');
    const name = match ? match[1].replaceAll('~1', '/').replaceAll('~0', '~') : undefined;
    if (name !== undefined && known.has(name) && !Object.hasOwn(schema.properties ?? {}, name))
      return undefined;
    return Array.isArray(scoped.elements)
      ? ({
          ...element,
          elements: scoped.elements
            .map(visit)
            .filter((child): child is UISchemaElement => child !== undefined),
        } as UISchemaElement)
      : element;
  };
  return visit(ui) ?? ({ type: 'VerticalLayout', elements: [] } as UISchemaElement);
}
