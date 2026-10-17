<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import { findDetailUISchema, useUiSchemaCycleGuard } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchRenderer,
    useConditionalFields,
    provideObjectErrors,
    conditionalLayout,
    useRendererMessages,
    useJsonFormsControlWithDetail,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Generate,
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

  const conditional = useConditionalFields(() => binding.control);
  const projectedSchema = $derived(conditional.value.schema);
  const messages = useRendererMessages();

  const nested = useNested('object');
  const objectLabel = $derived(
    binding.control.uischema.label === false ? '' : binding.control.label,
  );

  // do not use the default value but the undefined so that
  // the property is cleared when property clear action is executed
  setIsDynamicProperty(false);

  // Computed values
  const hasAdditionalProperties = $derived(
    projectedSchema.additionalProperties === true ||
      !isEmpty(projectedSchema.patternProperties) ||
      isObject(projectedSchema.additionalProperties),
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (binding.control.data !== null &&
        typeof binding.control.data === 'object' &&
        !Array.isArray(binding.control.data) &&
        Object.keys(binding.control.data).some(
          (key) =>
            !Object.hasOwn(projectedSchema.properties ?? {}, key) &&
            !conditional.value.known.has(key),
        )) ||
      (binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        projectedSchema.additionalProperties === undefined),
  );

  const uiSchemaGenerator = (): UISchemaElement => {
    const uiSchema = Generate.uiSchema(
      projectedSchema,
      'Group',
      undefined,
      binding.control.rootSchema,
    );
    if (isEmpty(binding.control.path)) {
      uiSchema.type = 'VerticalLayout';
    } else {
      (uiSchema as GroupLayout).label = objectLabel;
    }
    return uiSchema;
  };

  const resolvedDetail = $derived(
    findDetailUISchema(
      binding.control.uischemas,
      projectedSchema,
      binding.control.uischema.scope,
      binding.control.path,
      uiSchemaGenerator,
      binding.control.uischema,
      binding.control.rootSchema,
    ),
  );

  const cycleGuard = useUiSchemaCycleGuard(() => ({
    uischema: resolvedDetail,
    path: binding.control.path,
  }));

  const detailUiSchema = $derived.by((): UISchemaElement => {
    let result = cycleGuard.cycle ? uiSchemaGenerator() : resolvedDetail;

    if (nested.level > 0) {
      result = cloneDeep(result);
      result.options = {
        ...result.options,
        bare: true,
        alignLeft: nested.level >= 4 || nested.parentElement === 'array',
      };
    }

    return conditionalLayout(result, projectedSchema, conditional.value.known);
  });
  const objectErrors = provideObjectErrors(
    () => binding.control,
    () => detailUiSchema,
  );
</script>

{#snippet content()}
  <div class="flex flex-col gap-2">
    {#each conditional.value.diagnostics as code (code)}
      <div role="status">{messages(code)}</div>
    {/each}
    {#if detailUiSchema.type !== 'Group' && objectErrors.message}
      <p
        role="alert"
        data-object-own-errors
        class="text-sm whitespace-pre-line text-red-600 dark:text-red-400"
      >
        {objectErrors.message}
      </p>
    {/if}
    <DispatchRenderer
      visible={binding.control.visible}
      enabled={binding.control.enabled}
      schema={projectedSchema}
      uischema={detailUiSchema}
      path={binding.control.path}
      renderers={binding.control.renderers}
      cells={binding.control.cells}
    >
      {#if showAdditionalProperties && detailUiSchema.type === 'Group'}
        <AdditionalProperties
          embedded
          input={binding}
          disallowedPropertyNames={[...conditional.value.known]}
        />
      {/if}
    </DispatchRenderer>
    {#if showAdditionalProperties && detailUiSchema.type !== 'Group'}
      <AdditionalProperties
        embedded={Boolean(binding.control.path)}
        input={binding}
        disallowedPropertyNames={[...conditional.value.known]}
      />
    {/if}
  </div>
{/snippet}

{#if binding.control.visible}
  {#if binding.control.path && detailUiSchema.type !== 'Group'}
    <Card class="min-w-full" data-object-boundary {...binding.flowbiteProps('Card')}>
      {#if objectLabel}<h3 class="text-lg font-bold">{objectLabel}</h3>{/if}
      {@render content()}
    </Card>
  {:else}
    {@render content()}
  {/if}
{/if}
