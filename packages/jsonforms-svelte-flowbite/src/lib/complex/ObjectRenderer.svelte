<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsControlWithDetail,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Generate,
    findUISchema,
    type ControlElement,
    type GroupLayout,
    type UISchemaElement,
  } from '@jsonforms/core';
  import cloneDeep from 'lodash/cloneDeep';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import { setIsDynamicProperty, useFlowbiteControl, useNested } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const input = useFlowbiteControl(useJsonFormsControlWithDetail(props));

  const nested = useNested('object');

  // do not use the default value but the undefined so that
  // the property is cleared when property clear action is executed
  setIsDynamicProperty(false);

  // Computed values
  const hasAdditionalProperties = $derived(
    !isEmpty(input.control.schema.patternProperties) ||
      isObject(input.control.schema.additionalProperties) ||
      input.control.schema.additionalProperties === true,
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (input.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        input.control.schema.additionalProperties === undefined),
  );

  const detailUiSchema = $derived.by((): UISchemaElement => {
    const uiSchemaGenerator = () => {
      const uiSchema = Generate.uiSchema(
        input.control.schema,
        'Group',
        undefined,
        input.control.rootSchema,
      );
      if (isEmpty(input.control.path)) {
        uiSchema.type = 'VerticalLayout';
      } else {
        (uiSchema as GroupLayout).label = input.control.label;
      }
      return uiSchema;
    };

    let result = findUISchema(
      input.control.uischemas,
      input.control.schema,
      input.control.uischema.scope,
      input.control.path,
      uiSchemaGenerator,
      input.control.uischema,
      input.control.rootSchema,
    );

    if (nested.level > 0) {
      result = cloneDeep(result);
      result.options = {
        ...result.options,
        bare: true,
        alignLeft: nested.level >= 4 || nested.parentElement === 'array',
      };
    }

    return result;
  });
</script>

{#if input.control.visible}
  <div>
    <DispatchRenderer
      visible={input.control.visible}
      enabled={input.control.enabled}
      schema={input.control.schema}
      uischema={detailUiSchema}
      path={input.control.path}
      renderers={input.control.renderers}
      cells={input.control.cells}
    />
    {#if showAdditionalProperties}
      <AdditionalProperties {input} />
    {/if}
  </div>
{/if}
