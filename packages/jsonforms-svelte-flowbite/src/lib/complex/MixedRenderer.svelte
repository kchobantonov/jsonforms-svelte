<script lang="ts">
  import {
    DispatchRenderer,
    useJsonForms,
    useJsonFormsControl,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    createControlElement,
    createDefaultValue,
    findUISchema,
    type ControlElement,
    type JsonFormsUISchemaRegistryEntry,
    type JsonSchema,
    type JsonSchema7,
    type UISchemaElement,
  } from '@jsonforms/core';
  import { Accordion, AccordionItem, Helper, Label, Select } from 'flowbite-svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import isEqual from 'lodash/isEqual';
  import set from 'lodash/set';
  import { untrack } from 'svelte';
  import { setIsDynamicProperty, useCombinatorTranslations, useFlowbiteControl } from '../util';

  interface SchemaRenderInfo {
    schema: JsonSchema;
    resolvedSchema: JsonSchema;
    uischema: UISchemaElement;
    label: string;
  }

  function cleanSchema(schema: JsonSchema): JsonSchema {
    // Define valid keywords for each JSON Schema type
    const validKeywords: Record<string, string[]> = {
      array: ['items', 'minItems', 'maxItems', 'uniqueItems', 'contains'],
      object: [
        'properties',
        'required',
        'additionalProperties',
        'minProperties',
        'maxProperties',
        'patternProperties',
        'dependencies',
        'propertyNames',
      ],
      string: ['minLength', 'maxLength', 'pattern', 'format'],
      number: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
      integer: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
      boolean: [],
      null: [],
    };

    const schemaType = schema.type as string;

    // Remove invalid keywords based on type
    for (const validType in validKeywords) {
      if (validType !== schemaType) {
        const keywords = validKeywords[validType];
        keywords.forEach((key) => {
          delete (schema as any)[key];
        });
      }
    }

    return schema;
  }

  function getSchemaTypesAsArray(schema: JsonSchema): string[] {
    if (typeof schema.type === 'string') {
      return [schema.type];
    }

    if (Array.isArray(schema.type)) {
      return schema.type;
    }

    if (Array.isArray(schema.enum)) {
      const enumTypes = new Set(schema.enum.map((value) => getJsonDataType(value)));
      if (!enumTypes.has(null)) {
        // return only if we were able to determine all types, otherwise return the default
        return Array.from(enumTypes).filter((type) => type !== null) as string[];
      }
    }

    // return any
    return ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];
  }

  const createMixedRenderInfos = (
    parentSchema: JsonSchema,
    schema: JsonSchema,
    rootSchema: JsonSchema,
    control: ControlElement,
    path: string,
    uischemas: JsonFormsUISchemaRegistryEntry[],
  ): SchemaRenderInfo[] => {
    let resolvedSchemas: JsonSchema[] = [];

    if (typeof schema.type === 'string') {
      resolvedSchemas.push(schema);
    } else {
      const types = getSchemaTypesAsArray(schema);

      types.forEach((type) => {
        resolvedSchemas.push({
          ...schema,
          type,
          default:
            schema.default !== undefined && type === getJsonDataType(schema.default)
              ? schema.default
              : undefined,
        });
      });
    }

    return resolvedSchemas.map((resolvedSchema) => {
      if (resolvedSchema.type === 'array') {
        resolvedSchema.items = resolvedSchema.items ?? {};
        if ((resolvedSchema.items as any) === true) {
          resolvedSchema.items = {
            type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
          };
        } else if (
          typeof (resolvedSchema.items as JsonSchema7).type !== 'string' &&
          !Array.isArray((resolvedSchema.items as JsonSchema7).type)
        ) {
          (resolvedSchema.items as JsonSchema7).type = [
            'array',
            'boolean',
            'integer',
            'null',
            'number',
            'object',
            'string',
          ];
        }
      }

      // help determining the correct renders by removing keywords not appropriate for the type
      let cleanedSchema = cleanSchema(resolvedSchema);

      const detailsForSchema = control.options
        ? control.options[cleanedSchema.type + '-detail']
        : undefined;

      const schemaControl = detailsForSchema
        ? {
            ...control,
            options: { ...control.options, detail: detailsForSchema },
          }
        : control;

      if (control.scope && (cleanedSchema.type === 'object' || cleanedSchema.type === 'array')) {
        const segments = control.scope.split('/');
        const startFromRoot = segments[0] === '#' || segments[0] === '';
        const startIndex = startFromRoot ? 1 : 0;

        if (segments.length > startIndex) {
          // for object schema the object renderer expects to get the parent schema
          const schemaPath = segments.slice(startIndex).join('.');
          if (schemaPath && isEqual(get(parentSchema, schemaPath), schema)) {
            // double check that the schema that we are going to replace is the schema that is with the mixed type
            const newSchema = cloneDeep(parentSchema);
            set(newSchema, schemaPath, cleanedSchema);
            cleanedSchema = newSchema;
          }
        }
      }

      const uischema = findUISchema(
        uischemas,
        cleanedSchema,
        control.scope,
        path,
        () => createControlElement(control.scope ?? '#'),
        schemaControl,
        rootSchema,
      );

      return {
        schema: cleanedSchema,
        resolvedSchema: resolvedSchema,
        uischema,
        label: `${resolvedSchema.type}`,
      };
    });
  };

  export function getJsonDataType(value: any): string | null {
    if (typeof value === 'string') {
      return 'string';
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    } else if (Array.isArray(value)) {
      return 'array';
    } else if (value === null) {
      return 'null';
    } else if (typeof value === 'object') {
      return 'object';
    }

    return null;
  }

  // Props
  const props: RendererProps<ControlElement> = $props();

  const path = props.path;
  const parentSchema = props.schema;
  const input = useCombinatorTranslations(useFlowbiteControl(useJsonFormsControl(props)));

  const jsonforms = useJsonForms();
  const t = useTranslator();

  const mixedRenderInfos = $derived.by(() => {
    const result = createMixedRenderInfos(
      parentSchema,
      input.control.schema,
      input.control.rootSchema,
      input.control.uischema,
      input.control.path,
      jsonforms.uischemas || [],
    );

    return result.filter((info) => info.uischema).map((info, index) => ({ ...info, index: index }));
  });

  const nullable = $derived(mixedRenderInfos.some((info) => info.resolvedSchema.type === 'null'));

  // State
  let valueType = $state<string | null>(getJsonDataType(untrack(() => input.control.data)));
  let selectedIndex = $state<number | null>(null);
  let currentlyExpanded = $state<boolean>(false);

  // Initialize selectedIndex based on current data type
  $effect(() => {
    let matchingInfo = mixedRenderInfos.find((entry) => entry.resolvedSchema.type === valueType);
    if (!matchingInfo) {
      // special case: integer is a subtype of number
      matchingInfo = mixedRenderInfos.find(
        (entry) => entry.resolvedSchema.type === 'number' && valueType === 'integer',
      );
    }

    const newIndex = matchingInfo ? matchingInfo.index : null;

    if (selectedIndex !== newIndex) {
      untrack(() => {
        selectedIndex = newIndex;
      });
    }
  });

  // Watch control data for changes (break the loop with untrack)
  let previousData = $state(untrack(() => input.control.data));

  $effect(() => {
    const newData = input.control.data;

    // Only react if data actually changed
    if (newData !== previousData) {
      untrack(() => {
        previousData = newData;
        const newType = getJsonDataType(newData);

        // Only update if type actually changed
        if (valueType !== newType) {
          valueType = newType;
        }
      });
    }
  });

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  function handleSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newIndex = target.value ? parseInt(target.value) : null;

    const newData =
      newIndex !== null
        ? createDefaultValue(mixedRenderInfos[newIndex].resolvedSchema, input.control.rootSchema)
        : undefined;

    // Just update the data - let the effects handle valueType and selectedIndex
    input.handleChange(input.control.path, newData);
    currentlyExpanded = true;
  }

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
      ? mixedRenderInfos[selectedIndex]?.uischema
      : undefined,
  );
</script>

{#if input.control.visible}
  <div class="flex items-center">
    {#if valueType === 'array' || valueType === 'object'}
      <Accordion flush>
        <AccordionItem open={currentlyExpanded} classes={{ button: 'p-0' }}>
          {#snippet header()}
            <div class="flex items-center">
              <div class="min-w-32 shrink-0">
                <Label for={input.control.id + '-input-selector'}
                  >{input.control
                    .label}{#if input.control.required && !input.appliedOptions.hideRequiredAsterisk}<span
                      class={'text-red-600 dark:text-red-400'}>*</span
                    >
                  {/if}
                </Label>
                <Select
                  id={input.control.id + '-input-selector'}
                  disabled={!input.control.enabled}
                  items={selectItems}
                  value={selectedIndex?.toString() ?? ''}
                  clearable={input.control.enabled}
                  onchange={handleSelectChange}
                  onClear={() => {
                    input.handleChange(input.control.path, undefined);
                    currentlyExpanded = false;
                  }}
                  onfocus={input.handleFocus}
                  onblur={input.handleBlur}
                  class="w-full"
                ></Select>
                {#if input.control.errors}
                  <Helper class="text-sm text-red-600 dark:text-red-400">
                    {input.control.errors}
                  </Helper>
                {/if}
              </div>
              <div class="grow truncate p-4">
                {input.computedLabel}
              </div>
            </div>
          {/snippet}

          <div>
            {#if schema && uischema && !(nullable && input.control.data === null)}
              <DispatchRenderer
                {schema}
                {uischema}
                {path}
                renderers={input.control.renderers}
                cells={input.control.cells}
                enabled={input.control.enabled}
              />
            {/if}
          </div>
        </AccordionItem>
      </Accordion>
    {:else}
      <div
        class={`mb-4 space-y-2 ${schema && uischema && !(nullable && input.control.data === null) ? 'min-w-32 shrink-0' : 'w-full'}`}
      >
        <Label for={input.control.id + '-input-selector'}
          >{input.control
            .label}{#if input.control.required && !input.appliedOptions.hideRequiredAsterisk}<span
              class={'text-red-600 dark:text-red-400'}>*</span
            >
          {/if}
        </Label>
        <Select
          id={input.control.id + '-input-selector'}
          disabled={!input.control.enabled}
          items={selectItems}
          value={selectedIndex?.toString() ?? ''}
          clearable={input.control.enabled}
          onchange={handleSelectChange}
          onClear={() => {
            input.handleChange(input.control.path, undefined);
            currentlyExpanded = false;
          }}
          onfocus={input.handleFocus}
          onblur={input.handleBlur}
          class="w-full"
        ></Select>
        {#if input.control.errors}
          <Helper class="text-sm text-red-600 dark:text-red-400">{input.control.errors}</Helper>
        {/if}
      </div>
      {#if schema && uischema && !(nullable && input.control.data === null)}
        <div class="flex-1">
          <DispatchRenderer
            {schema}
            {uischema}
            {path}
            renderers={input.control.renderers}
            cells={input.control.cells}
            enabled={input.control.enabled}
          />
        </div>
      {/if}
    {/if}
  </div>
{/if}
