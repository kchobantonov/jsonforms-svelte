<script lang="ts">
  import {
    DispatchRenderer,
    JsonForms,
    useJsonForms,
    useJsonFormsControlWithDetail,
    useTranslator,
    type JsonFormsChangeEvent,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Generate,
    Resolve,
    composePaths,
    createControlElement,
    createDefaultValue,
    getI18nKeyPrefix,
    type GroupLayout,
    type JsonSchema,
    type JsonSchema7,
    type UISchemaElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Button, Card, Span, Tooltip, P } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import get from 'lodash/get';
  import isEqual from 'lodash/isEqual';
  import isPlainObject from 'lodash/isPlainObject';
  import omit from 'lodash/omit';
  import startCase from 'lodash/startCase';

  import { AdditionalPropertiesTranslationEnum } from '../../i18n';
  import { additionalPropertiesDefaultTranslations } from '../../i18n/additionalPropertiesTranslations';
  import { getAdditionalPropertiesTranslations } from '../../i18n/i18nUtil';
  import { setIsDynamicProperty, useControlAppliedOptions } from '../../util';
  import { untrack } from 'svelte';

  type Input = ReturnType<typeof useJsonFormsControlWithDetail>;

  interface AdditionalPropertyType {
    propertyName: string;
    path: string;
    schema: JsonSchema | undefined;
    uischema: UISchemaElement | undefined;
  }

  // Props
  let {
    input,
  }: {
    input: Input;
  } = $props();

  const control = $derived(input.control);

  const reservedPropertyNames = $derived(Object.keys(control.schema.properties || {}));

  const additionalKeys = $derived(
    Object.keys(control.data || {}).filter((k) => !reservedPropertyNames.includes(k)),
  );

  const flowbiteProps = (path: string) => {
    const props = get(appliedOptions.flowbite, path);

    return props && isPlainObject(props) ? props : {};
  };

  const toAdditionalPropertyType = (
    propName: string,
    parentSchema: JsonSchema,
    rootSchema: JsonSchema,
  ): AdditionalPropertyType => {
    let propSchema: JsonSchema | undefined = undefined;
    let propUiSchema: UISchemaElement | undefined = undefined;

    if (parentSchema.patternProperties) {
      const matchedPattern = Object.keys(parentSchema.patternProperties).find((pattern) =>
        new RegExp(pattern).test(propName),
      );
      if (matchedPattern) {
        propSchema = parentSchema.patternProperties[matchedPattern];
      }
    }

    if (
      (!propSchema && typeof parentSchema.additionalProperties === 'object') ||
      parentSchema.additionalProperties === true
    ) {
      propSchema =
        parentSchema.additionalProperties === true
          ? { additionalProperties: true }
          : parentSchema.additionalProperties;
    }

    if (typeof propSchema?.$ref === 'string') {
      propSchema = Resolve.schema(propSchema, propSchema.$ref, rootSchema);
    }

    propSchema = propSchema ?? {};

    if (propSchema.type === undefined) {
      propSchema = {
        ...propSchema,
        type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
      };
    }

    if (propSchema.type === 'array') {
      propUiSchema = Generate.uiSchema(propSchema, 'Group', undefined, control.rootSchema);
      (propUiSchema as GroupLayout).label = propSchema.title ?? startCase(propName);
    } else {
      propUiSchema = createControlElement('#');
    }

    propSchema = {
      ...propSchema,
      title: propName,
    };
    if (propSchema.type === 'object') {
      propSchema.additionalProperties =
        propSchema.additionalProperties !== false
          ? (propSchema.additionalProperties ?? true)
          : false;
    } else if (propSchema.type === 'array') {
      propSchema.items = propSchema.items ?? {};
    }

    return {
      propertyName: propName,
      path: composePaths(control.path, propName),
      schema: propSchema,
      uischema: propUiSchema,
    };
  };

  const appliedOptions = $derived(useControlAppliedOptions(input).value);

  let additionalPropertyItems = $state<AdditionalPropertyType[]>(
    untrack(() =>
      additionalKeys.map((propName) =>
        toAdditionalPropertyType(propName, control.schema, control.rootSchema),
      ),
    ),
  );

  let newPropertyName = $state<string | null>('');
  let newPropertyErrors = $state<ErrorObject[] | undefined>(undefined);
  let additionalErrors = $state<ErrorObject[]>([]);

  const propertyNameSchema = $derived.by((): JsonSchema7 => {
    let result: JsonSchema7 = {
      type: 'string',
    };
    // TODO: create issue against jsonforms to add propertyNames into the JsonSchema interface
    // propertyNames exist in draft-6 but not defined in the JsonSchema
    if (typeof (control.schema as any).propertyNames === 'object') {
      result = {
        ...(control.schema as any).propertyNames,
        ...result,
      };
    } else if (
      (control.schema as any).additionalProperties === false &&
      typeof (control.schema as any).patternProperties === 'object'
    ) {
      // check if additionalProperties explicitly set to false then the only valid property names will be derived from patternProperties
      const patterns = Object.keys((control.schema as any).patternProperties);
      if (patterns.length > 0) {
        result = {
          pattern: patterns.join('|'),
          ...result,
        };
      }
    }
    return result;
  });

  const propertyNameChange = (event: JsonFormsChangeEvent) => {
    if (newPropertyName === event.data) {
      return;
    }
    newPropertyName = typeof event.data === 'string' ? event.data : '';
    let newAdditionalErrors: ErrorObject[] = [];

    if (
      typeof control.data === 'object' &&
      control.data &&
      Object.keys(control.data).find((e) => e === newPropertyName)
    ) {
      newAdditionalErrors = [
        {
          data: newPropertyName,
          instancePath: '',
          keyword: '',
          message: translations[AdditionalPropertiesTranslationEnum.propertyAlreadyDefined]!,
          params: { propertyName: newPropertyName },
          schemaPath: '',
        },
      ];
    }

    // JSONForms has special means for "[]." chars - those are part of the path composition so for now we can't support those without special handling
    if (
      newPropertyName.includes('[') ||
      newPropertyName.includes(']') ||
      newPropertyName.includes('.')
    ) {
      newAdditionalErrors = [
        {
          data: newPropertyName,
          instancePath: '',
          keyword: '',
          message: translations[AdditionalPropertiesTranslationEnum.propertyNameInvalid]!,
          params: { propertyName: newPropertyName },
          schemaPath: '',
        },
      ];
    }

    if (!isEqual(additionalErrors, newAdditionalErrors)) {
      // only change the additional errors if different to prevent recursive calls
      additionalErrors = newAdditionalErrors;
    }
    newPropertyErrors = [...(event.errors ?? [])];
  };

  const t = useTranslator();

  const i18nAdditionalPropertiesPrefix = $derived(
    getI18nKeyPrefix(control.schema, control.uischema, control.path + '.additionalProperties'),
  );

  const translations = $derived(
    getAdditionalPropertiesTranslations(
      t.value,
      additionalPropertiesDefaultTranslations,
      i18nAdditionalPropertiesPrefix,
      control.label,
      newPropertyName,
    ),
  );

  const propertyNameLabel = $derived(
    translations[AdditionalPropertiesTranslationEnum.propertyNameLabel],
  );

  const { validationMode: parentValidationMode, i18n, middleware, ajv } = useJsonForms();

  // if the new property name is not specified then hide any errors
  const validationMode = $derived(newPropertyName ? parentValidationMode : 'ValidateAndHide');

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const maxPropertiesReached = $derived(
    control.schema.maxProperties !== undefined && // we have maxProperties constraint
      control.data && // we have data to check
      // the current number of properties in the object is greater or equals to the maxProperties
      Object.keys(control.data).length >= control.schema.maxProperties,
  );

  const addPropertyDisabled = $derived(
    // add is disabled because the overall control is disabled
    !control.enabled ||
      // add is disabled because of constraints
      (appliedOptions.restrict && maxPropertiesReached) ||
      // add is disabled because there are errors for the new property name or it is not specified
      (newPropertyErrors && newPropertyErrors.length > 0) ||
      (additionalErrors && additionalErrors.length > 0) ||
      !newPropertyName,
  );

  const minPropertiesReached = $derived(
    control.schema.minProperties !== undefined && // we have minProperties constraint
      control.data && // we have data to check
      // the current number of properties in the object is less or equals to the minProperties
      Object.keys(control.data).length <= control.schema.minProperties,
  );

  const removePropertyDisabled = $derived(
    // add is disabled because the overall control is disabled
    !control.enabled ||
      // add is disabled because of constraints
      (appliedOptions.restrict && minPropertiesReached),
  );

  const additionalPropertiesTitle = $derived.by(() => {
    const title = (control.schema.additionalProperties as JsonSchema7)?.title;
    return title ? t.value(title, title) : title;
  });

  // Watch control.data for changes
  $effect(() => {
    const newData = control.data;

    function isEqualIgnoringKeys(
      obj1: Record<string, any>,
      obj2: Record<string, any>,
      keysToIgnore: string[],
    ) {
      // Omit the specified keys from both objects
      const filteredObj1 = omit(obj1, keysToIgnore);
      const filteredObj2 = omit(obj2, keysToIgnore);

      // compare with property order as well
      return JSON.stringify(filteredObj1) === JSON.stringify(filteredObj2);
    }

    // Re-compute additionalPropertyItems when data changes
    additionalPropertyItems = additionalKeys.map((propName) =>
      toAdditionalPropertyType(propName, control.schema, control.rootSchema),
    );
  });

  // Methods
  function addProperty() {
    if (newPropertyName) {
      const additionalProperty = toAdditionalPropertyType(
        newPropertyName,
        control.schema,
        control.rootSchema,
      );
      if (additionalProperty) {
        additionalPropertyItems = [...additionalPropertyItems, additionalProperty];
      }

      if (typeof control.data === 'object' && additionalProperty.schema) {
        const updatedData = { ...control.data };

        updatedData[newPropertyName] = createDefaultValue(
          additionalProperty.schema,
          control.rootSchema,
        );

        // we need always to preserve the key even when the value is "empty"
        input.handleChange(control.path, updatedData);
      }
    }
    newPropertyName = '';
  }

  function removeProperty(propName: string): void {
    additionalPropertyItems = additionalPropertyItems.filter((d) => d.propertyName !== propName);
    if (typeof control.data === 'object') {
      const updatedData = { ...control.data };
      delete updatedData[propName];
      input.handleChange(control.path, updatedData);
    }
  }
</script>

{#if control.visible}
  <Card class="mt-1 mb-1 min-w-full" {...flowbiteProps('Card')}>
    <div class="pt-2 pr-4 pb-2 pl-4">
      <div class="flex items-center gap-2">
        <P class="hidden md:block">{additionalPropertiesTitle}</P>
        <div class="flex-1">
          <JsonForms
            data={newPropertyName}
            uischema={{
              type: 'Control',
              scope: '#',
              label: propertyNameLabel,
            }}
            schema={propertyNameSchema}
            {additionalErrors}
            renderers={control.renderers}
            cells={control.cells}
            config={control.config}
            readonly={!control.enabled}
            {validationMode}
            {i18n}
            {ajv}
            {middleware}
            onchange={propertyNameChange}
          />
        </div>
        <Button
          color="primary"
          size="sm"
          disabled={addPropertyDisabled}
          onclick={addProperty}
          aria-label={translations.addAriaLabel}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{translations.addTooltip}</Span>
        </Tooltip>
      </div>
    </div>

    <div class="pr-4 pl-4">
      {#each additionalPropertyItems as element (element.propertyName)}
        <div class="mb-2 flex items-start gap-2">
          <div class="flex-1">
            {#if element.schema && element.uischema}
              <DispatchRenderer
                schema={element.schema}
                uischema={element.uischema}
                path={element.path}
                enabled={control.enabled}
                renderers={control.renderers}
                cells={control.cells}
              />
            {/if}
          </div>
          {#if control.enabled}
            <div class="shrink-0">
              <Button
                color="red"
                size="sm"
                disabled={removePropertyDisabled}
                onclick={() => removeProperty(element.propertyName)}
                aria-label={translations.removeAriaLabel}
              >
                <TrashBinOutline class="h-4 w-4" />
              </Button>
              <Tooltip>
                <Span>{translations.removeTooltip}</Span>
              </Tooltip>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </Card>
{/if}
