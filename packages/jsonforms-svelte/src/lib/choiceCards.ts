import {
  Resolve,
  and,
  isEnumControl,
  isOneOfControl,
  optionIs,
  or,
  rankWith,
  type ControlElement,
  type JsonSchema,
  type JsonFormsUISchemaRegistryEntry,
  type UISchemaElement,
} from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import { findDetailUISchema } from './detail';

export interface CardChoice {
  value?: unknown;
  branch?: number;
  label?: string;
  i18n?: string;
  disabled?: boolean;
  content?: UISchemaElement;
  selectedContent?: UISchemaElement;
  detail?: string | UISchemaElement | { elements: UISchemaElement[] };
}

export const choiceCardsTester = rankWith(
  21,
  and(optionIs('format', 'cards'), or(isEnumControl, isOneOfControl)),
);

/** Selectable labels only admit presentation nodes, never nested interactive controls. */
export function isCardPresentation(element: unknown): element is UISchemaElement {
  if (!element || typeof element !== 'object') return false;
  const node = element as { type?: unknown; elements?: unknown };
  return (
    node.type === 'Label' ||
    node.type === 'ImageView' ||
    ((node.type === 'VerticalLayout' || node.type === 'HorizontalLayout') &&
      Array.isArray(node.elements) &&
      node.elements.every(isCardPresentation))
  );
}

/** Resolve branch details before dispatch so GENERATE cannot reuse registered layouts. */
export function resolveCardChoices(
  schema: JsonSchema,
  control: ControlElement,
  path: string,
  rootSchema: JsonSchema,
  registry: JsonFormsUISchemaRegistryEntry[] = [],
) {
  const branches = schema.oneOf;
  const constants = branches?.every((branch) =>
    Object.prototype.hasOwnProperty.call(branch, 'const'),
  );
  const branchMode = !schema.enum && !!branches && !constants;
  const values: unknown[] =
    schema.enum ?? (constants ? branches!.map((branch) => branch.const) : []);
  const custom: CardChoice[] = Array.isArray(control.options?.choices)
    ? control.options.choices
    : [];
  const choices = (branchMode ? branches! : values).map((_, index) => {
    const authored =
      custom.find((choice) =>
        branchMode
          ? choice.branch === index
          : Object.prototype.hasOwnProperty.call(choice, 'value') &&
            isEqual(choice.value, values[index]),
      ) ?? {};
    if (!branchMode)
      return { ...authored, value: values[index], schema: undefined, uischema: undefined };
    const branch = branches![index];
    const resolved = branch.$ref ? Resolve.schema(rootSchema, branch.$ref, rootSchema) : undefined;
    const branchSchema = resolved ?? branch;
    const detailControl =
      authored.detail === undefined
        ? control
        : {
            ...control,
            options: { ...control.options, detail: authored.detail },
          };
    return {
      ...authored,
      branch: index,
      label: authored.label ?? branch.title ?? resolved?.title ?? `oneOf-${index}`,
      schema: branchSchema,
      uischema: findDetailUISchema(
        registry,
        branchSchema,
        control.scope,
        path,
        undefined,
        detailControl,
        rootSchema,
      ),
    };
  });
  return { branchMode, values, choices };
}

/** A required, distinct primitive const identifies an incomplete object branch. */
export function cardDiscriminatorIndex(branches: JsonSchema[], data: unknown): number {
  if (!data || typeof data !== 'object' || Array.isArray(data) || branches.length < 2) return -1;
  for (const key of Object.keys(branches[0]?.properties ?? {})) {
    const fields = branches.map((branch) => branch.properties?.[key]);
    if (
      !branches.every((branch) => branch.required?.includes(key)) ||
      !fields.every(
        (field) =>
          field &&
          Object.prototype.hasOwnProperty.call(field, 'const') &&
          (field.const === null || typeof field.const !== 'object'),
      )
    )
      continue;
    const values: unknown[] = fields.map((field) => field!.const);
    if (new Set(values.map((value) => JSON.stringify(value))).size !== branches.length) continue;
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const index = values.findIndex((value) =>
      isEqual(value, (data as Record<string, unknown>)[key]),
    );
    if (index >= 0) return index;
  }
  return -1;
}

/** Presentation inside a choice card must not introduce interactive descendants. */
export const CardPresentationContext = Symbol('jsonforms.cardPresentation');
