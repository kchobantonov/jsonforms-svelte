import type { JsonSchema } from '@jsonforms/core';
import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
import type { ControlProps, useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { useMixedTypeChange } from './mixedTypeChange.svelte';
import { createMixedRenderInfos, type SchemaRenderInfo } from './schemaUtils';
import type { createMixedTreeBuilder, TreeNode, TreeNodeData } from './treeBuilder.svelte';
import { getJsonDataType, hasStructuralChange, type JsonDataType } from './jsonTypeUtils';
import { untrack } from 'svelte';
import isEqual from 'lodash/isEqual';

export function useMixedEditor(
  props: ControlProps,
  binding: Pick<ReturnType<typeof useJsonFormsControl>, 'control' | 'handleChange'> & {
    controlWrapper: { errors?: string };
  },
  buildTreeFromData: ReturnType<typeof createMixedTreeBuilder>,
  view: { readonly clearable: boolean; readonly showTree: boolean; expand(): void },
) {
  const jsonforms = useJsonForms();
  const t = useTranslator();
  const message = useRendererMessages();
  let inputDataType = $state<JsonDataType | null>(
    getJsonDataType(untrack(() => binding.control.data)),
  );
  let treeRevision = $state(0);
  let selectedIndex = $state<number | null>(null);
  let treeNodes = $state.raw<TreeNode<TreeNodeData>[] | undefined>(undefined);
  let previousData = untrack(() => binding.control.data);

  const { confirmation, requestTypeChange } = useMixedTypeChange(binding, {
    get choices() {
      return mixedRenderInfos;
    },
    get index() {
      return selectedIndex;
    },
    get clearable() {
      return view.clearable;
    },
    select(index, type) {
      if (index === null || type) inputDataType = type as JsonDataType | null;
      if (type === 'object' || type === 'array') view.expand();
      selectedIndex = index;
    },
  });

  const mixedRenderInfos = $derived.by((): (SchemaRenderInfo & { index: number })[] => {
    const result = createMixedRenderInfos(
      props.schema,
      binding.control.schema,
      binding.control.rootSchema,
      binding.control.uischema,
      binding.control.path,
      jsonforms.uischemas || [],
    );

    return result.filter((info) => info.uischema).map((info, index) => ({ ...info, index }));
  });

  const numericError = $derived(
    jsonforms.core?.validationMode !== 'NoValidation' &&
      jsonforms.core?.validationMode !== 'ValidateAndHide' &&
      selectedIndex !== null &&
      selectedIndex !== undefined &&
      mixedRenderInfos[selectedIndex]?.resolvedSchema.type === 'integer' &&
      typeof binding.control.data === 'number' &&
      !Number.isInteger(binding.control.data)
      ? message('mixed.integerRequired')
      : '',
  );
  const mixedErrors = $derived(
    [binding.controlWrapper.errors, numericError].filter(Boolean).join('\n'),
  );

  const nullable = $derived(mixedRenderInfos.some((info) => info.resolvedSchema.type === 'null'));

  const selectItems = $derived(
    mixedRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(item.label, item.label),
    })),
  );

  const schema = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? mixedRenderInfos[selectedIndex]?.schema
      : undefined,
  );

  const uischema = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? (() => {
          const valueUiSchema = mixedRenderInfos[selectedIndex]?.uischema;
          return valueUiSchema
            ? {
                ...valueUiSchema,
                i18n:
                  ('i18n' in valueUiSchema ? valueUiSchema.i18n : undefined) ??
                  binding.control.uischema.i18n,
                label:
                  ('label' in valueUiSchema ? valueUiSchema.label : undefined) ??
                  binding.control.uischema.label,
                ...(valueUiSchema.type === 'Control' &&
                binding.control.uischema.options?.validateActiveBranch !== undefined
                  ? {
                      options: {
                        ...valueUiSchema.options,
                        validateActiveBranch:
                          valueUiSchema.options?.validateActiveBranch ??
                          binding.control.uischema.options.validateActiveBranch,
                      },
                    }
                  : {}),
              }
            : undefined;
        })()
      : undefined,
  );

  const structuredUISchema = $derived(
    uischema?.type === 'Control' && 'scope' in uischema && uischema.scope === '#'
      ? { ...uischema, label: false }
      : uischema,
  );
  const booleanUiSchema = $derived(
    uischema && {
      ...uischema,
      label: binding.control.label,
      options: { ...uischema.options, hideControlWrapper: true },
    },
  );

  function schemaSupportsInputType(
    schemaType: JsonSchema['type'] | undefined,
    dataType: JsonDataType | null,
  ): boolean {
    if (!dataType || typeof schemaType !== 'string') {
      return false;
    }

    // JSON Schema "number" accepts integer values as well.
    return schemaType === dataType || (schemaType === 'number' && dataType === 'integer');
  }

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize selectedIndex based on current data type
  $effect(() => {
    const currentlySelected =
      selectedIndex !== null && selectedIndex !== undefined
        ? mixedRenderInfos[selectedIndex]
        : undefined;

    if (
      currentlySelected &&
      schemaSupportsInputType(currentlySelected.resolvedSchema.type, inputDataType)
    ) {
      return;
    }

    let matchingInfo = mixedRenderInfos.find(
      (entry) => entry.resolvedSchema.type === inputDataType,
    );
    if (!matchingInfo) {
      // special case: integer is a subtype of number
      matchingInfo = mixedRenderInfos.find(
        (entry) => entry.resolvedSchema.type === 'number' && inputDataType === 'integer',
      );
    }

    const newIndex = matchingInfo ? matchingInfo.index : null;

    if (selectedIndex !== newIndex) {
      untrack(() => {
        selectedIndex = newIndex;
      });
    }
  });

  // Watch control data for changes
  $effect(() => {
    const newData = binding.control.data;

    if (newData !== previousData) {
      untrack(() => {
        const structuralChange = hasStructuralChange(previousData, newData, true);
        previousData = newData;

        if (structuralChange) {
          treeRevision += 1;
        }

        const newType = getJsonDataType(newData);
        const keepNumericIntent =
          (inputDataType === 'number' || inputDataType === 'integer') &&
          (newType === 'number' || newType === 'integer');
        if (inputDataType !== newType && !keepNumericIntent) {
          inputDataType = newType;
        }
      });
    }
  });

  // Stable projections avoid rebuilding when only an unrelated control changes.
  let previousTreeSchemas: { schema: JsonSchema; rootSchema: JsonSchema } | undefined;
  const treeSchemas = $derived.by(() => {
    const next = { schema: binding.control.schema, rootSchema: binding.control.rootSchema };
    // Bindings may supply equivalent new schema objects after unrelated edits.
    // Retain only their references, not cloned snapshots or prepared node schemas.
    if (!isEqual(next, previousTreeSchemas)) previousTreeSchemas = next;
    return previousTreeSchemas!;
  });
  const treePath = $derived(binding.control.path);
  const treeLabel = $derived(binding.control.label);

  // Rebuild on relevant data changes and schema-only updates.
  $effect(() => {
    void treeRevision;
    const { schema, rootSchema } = treeSchemas;
    const path = treePath;
    const label = treeLabel;
    treeNodes = view.showTree
      ? buildTreeFromData(
          untrack(() => binding.control.data),
          schema,
          rootSchema,
          path,
          label,
          true,
          (index) => message('mixed.item', { index }),
        )
      : undefined;
  });

  return {
    confirmation,
    requestTypeChange,
    get inputDataType() {
      return inputDataType;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    get treeNodes() {
      return treeNodes;
    },
    get mixedRenderInfos() {
      return mixedRenderInfos;
    },
    get mixedErrors() {
      return mixedErrors;
    },
    get nullable() {
      return nullable;
    },
    get selectItems() {
      return selectItems;
    },
    get schema() {
      return schema;
    },
    get uischema() {
      return uischema;
    },
    get structuredUISchema() {
      return structuredUISchema;
    },
    get booleanUiSchema() {
      return booleanUiSchema;
    },
  };
}
