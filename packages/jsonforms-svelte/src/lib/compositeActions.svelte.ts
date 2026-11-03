import { Resolve, type JsonSchema } from '@jsonforms/core';
import { useDeletionConfirmation } from './deletionConfirmation.svelte';
import { useJsonForms, type useJsonFormsCell } from './jsonFormsCompositions.svelte';
import { dataPathSegments } from './dataPath';
import { getContext } from 'svelte';
import { LiteralDataContextSymbol, type LiteralDataContext } from './literalDataContext';

export function schemaAtDataPath(root: JsonSchema, segments: string[]): JsonSchema | undefined {
  let schema: JsonSchema | undefined = root;
  for (const segment of segments) {
    if (!schema) return undefined;
    if (schema.$ref) schema = Resolve.schema(root, schema.$ref, root);
    if (!schema) return undefined;
    if (schema.type === 'array') {
      const positional: JsonSchema[] | undefined = (
        schema as JsonSchema & { prefixItems?: JsonSchema[] }
      ).prefixItems;
      schema =
        positional?.[Number(segment)] ??
        ((Array.isArray(schema.items) ? schema.items[Number(segment)] : schema.items) as
          | JsonSchema
          | undefined);
    } else {
      const declared =
        schema.properties && Object.hasOwn(schema.properties, segment)
          ? schema.properties[segment]
          : undefined;
      schema =
        declared ??
        (typeof schema.additionalProperties === 'object' ? schema.additionalProperties : undefined);
    }
  }
  return schema?.$ref ? Resolve.schema(root, schema.$ref, root) : schema;
}
export function preventsEmpty(schema: JsonSchema, array: boolean): boolean {
  if (schema.allOf?.some((part) => preventsEmpty(part, array))) return true;
  if (array)
    return (
      (schema.minItems ?? 0) > 0 ||
      (!!(schema as JsonSchema & { contains?: unknown }).contains &&
        ((schema as JsonSchema & { minContains?: number }).minContains ?? 1) > 0)
    );
  return (schema.minProperties ?? 0) > 0 || !!schema.required?.length;
}
export function useCompositeActions(
  binding: ReturnType<typeof useJsonFormsCell>,
  dynamic: boolean,
  exactPath?: () => readonly string[],
) {
  const jsonforms = useJsonForms();
  const literal = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  const deletion = useDeletionConfirmation(
    () => ({ ...binding.cell, options: binding.cell.uischema.options }),
    'compositeCell',
    () => true,
  );
  const options = $derived({ ...binding.cell.config, ...binding.cell.uischema.options });
  const enabled = $derived(binding.cell.enabled && binding.cell.visible && !binding.cell.readonly);
  const present = $derived(binding.cell.data !== undefined);
  const array = $derived(Array.isArray(binding.cell.data) || binding.cell.schema.type === 'array');
  const restricted = $derived(options.restrict !== false);
  const parts = $derived([
    ...(literal?.segments() ?? []),
    ...(exactPath?.() ?? dataPathSegments(binding.cell.path)),
  ]);
  const parent = $derived(
    parts
      .slice(0, -1)
      .reduce<unknown>(
        (value, segment) =>
          value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
            ? (value as Record<string, unknown>)[segment]
            : undefined,
        literal ? literal.rootData() : jsonforms.core?.data,
      ),
  );
  const parentSchema = $derived(
    schemaAtDataPath(literal?.rootSchema?.() ?? jsonforms.core?.schema ?? {}, parts.slice(0, -1)),
  );
  const canRemove = $derived(
    enabled &&
      present &&
      !dynamic &&
      !Array.isArray(parent) &&
      options.clearable !== false &&
      !options.disableRemove &&
      (!restricted ||
        !parentSchema?.minProperties ||
        !parent ||
        Object.keys(parent).length > parentSchema.minProperties),
  );
  const empty = $derived(array ? [] : {});
  const canEmpty = $derived(
    enabled &&
      present &&
      binding.cell.data != null &&
      typeof binding.cell.data === 'object' &&
      Object.keys(binding.cell.data).length > 0 &&
      !options.disableRemove &&
      (!restricted || !preventsEmpty(binding.cell.schema, array)),
  );
  return {
    get pending() {
      return deletion.pending;
    },
    get accept() {
      return deletion.accept;
    },
    get cancel() {
      return deletion.cancel;
    },
    get enabled() {
      return enabled;
    },
    get present() {
      return present;
    },
    get canRemove() {
      return canRemove;
    },
    get canEmpty() {
      return canEmpty;
    },
    get showRemove() {
      return present && !dynamic && !Array.isArray(parent) && options.clearable !== false;
    },
    empty() {
      if (canEmpty) binding.handleChange(binding.cell.path, empty);
    },
    remove() {
      deletion.request(
        () => [binding.cell.data],
        () => binding.handleChange(binding.cell.path, undefined),
        () => canRemove,
      );
    },
  };
}
