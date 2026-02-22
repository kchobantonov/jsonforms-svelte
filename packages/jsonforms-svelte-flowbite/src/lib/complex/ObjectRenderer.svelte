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

  const binding = useFlowbiteControl(useJsonFormsControlWithDetail(props));

  const nested = useNested('object');

  // do not use the default value but the undefined so that
  // the property is cleared when property clear action is executed
  setIsDynamicProperty(false);

  // Computed values
  const hasAdditionalProperties = $derived(
    binding.control.schema.additionalProperties === true ||
      !isEmpty(binding.control.schema.patternProperties) ||
      isObject(binding.control.schema.additionalProperties),
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        binding.control.schema.additionalProperties === undefined),
  );

  const detailUiSchema = $derived.by((): UISchemaElement => {
    const uiSchemaGenerator = () => {
      const uiSchema = Generate.uiSchema(
        binding.control.schema,
        'Group',
        undefined,
        binding.control.rootSchema,
      );
      if (isEmpty(binding.control.path)) {
        uiSchema.type = 'VerticalLayout';
      } else {
        (uiSchema as GroupLayout).label = binding.control.label;
      }
      return uiSchema;
    };

    let result = findUISchema(
      binding.control.uischemas,
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
      uiSchemaGenerator,
      binding.control.uischema,
      binding.control.rootSchema,
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

{#if binding.control.visible}
  <div class="flex flex-col gap-2">
    <DispatchRenderer
      visible={binding.control.visible}
      enabled={binding.control.enabled}
      schema={binding.control.schema}
      uischema={detailUiSchema}
      path={binding.control.path}
      renderers={binding.control.renderers}
      cells={binding.control.cells}
    >
      {#if showAdditionalProperties && detailUiSchema.type === 'Group'}
        <AdditionalProperties input={binding} />
      {/if}
    </DispatchRenderer>
    {#if showAdditionalProperties && detailUiSchema.type !== 'Group'}
      <AdditionalProperties input={binding} />
    {/if}
  </div>
{/if}
