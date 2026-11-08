<script lang="ts">
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  import SectionIndicators from '../../layouts/SectionIndicators.svelte';
  import TupleAction from '../../components/TupleAction.svelte';
  import {
    createAdditionalPropertyNameSchema,
    additionalPropertySchema,
    usePendingControlChanges,
    useCollectionAction,
    useCollectionPagination,
    collectionErrorPositions,
    dataPathSegments,
    scopeDataSegments,
    useRendererMessages,
    useDeletionConfirmation,
    useAdditionalPropertyErrors,
    usePropertyNameErrors,
    useErrorSummary,
    useNameConstraintMessage,
    LiteralControl,
    PropertyIdentityStore,
    JsonForms,
    useJsonForms,
    useJsonFormsControlWithDetail,
    useTranslator,
    validateAdditionalPropertyName,
    type JsonFormsChangeEvent,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Generate,
    composePaths,
    createControlElement,
    createDefaultValue,
    getI18nKeyPrefix,
    type ControlElement,
    type GroupLayout,
    type JsonSchema,
    type JsonSchema7,
    type UISchemaElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Input as InputControl } from '@jsonforms-svelte-shadcn-ui/input';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import {
    PencilIcon as PenOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import get from 'lodash/get';
  import isEqual from 'lodash/isEqual';
  import cloneDeep from 'lodash/cloneDeep';
  import isPlainObject from 'lodash/isPlainObject';
  import startCase from 'lodash/startCase';

  import { AdditionalPropertiesTranslationEnum } from '../../i18n';
  import {
    additionalPropertiesDefaultTranslations,
    additionalPropertyMessageKey,
  } from '../../i18n/additionalPropertiesTranslations';
  import { getAdditionalPropertiesTranslations } from '../../i18n/i18nUtil';
  import { getPortalTarget, setIsDynamicProperty, useControlAppliedOptions } from '../../util';

  import CollectionPager from '../../components/CollectionPager.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';
  import LocalizedDialogContent from '../../components/LocalizedDialogContent.svelte';

  type Input = ReturnType<typeof useJsonFormsControlWithDetail>;

  interface AdditionalPropertyType {
    propertyName: string;
    path: string;
    schema: JsonSchema;
    uischema: UISchemaElement | undefined;
  }

  // Props
  let {
    input,
    disallowedPropertyNames = [],
    embedded = false,
  }: {
    input: Input;
    disallowedPropertyNames?: string[];
    embedded?: boolean;
  } = $props();

  const control = $derived(input.control);
  const controlPathSegments = $derived(
    control.pathSegments
      ? [...control.pathSegments, ...scopeDataSegments(control.uischema.scope)]
      : dataPathSegments(control.path),
  );
  const rejected = useAdditionalPropertyErrors(() => control);
  const nameErrors = usePropertyNameErrors(() => control);
  usePendingControlChanges();
  const command = useCollectionAction(
    () => control,
    () => page.prepare(),
  );

  const reservedPropertyNames = $derived([
    ...Object.keys(control.schema.properties || {}),
    ...disallowedPropertyNames,
  ]);

  const objectData = $derived(
    control.data !== null && typeof control.data === 'object' && !Array.isArray(control.data)
      ? control.data
      : undefined,
  );
  const additionalKeys = $derived(
    Object.keys(objectData ?? {}).filter((k) => !reservedPropertyNames.includes(k)),
  );

  const shadcnProps = (path: string) => {
    const props = get(appliedOptions.shadcn, path);

    return props && isPlainObject(props) ? props : {};
  };

  const toAdditionalPropertyType = (
    propName: string,
    parentSchema: JsonSchema,
    rootSchema: JsonSchema,
  ): AdditionalPropertyType => {
    let propSchema = additionalPropertySchema(propName, parentSchema, rootSchema);
    let propUiSchema: UISchemaElement | undefined = undefined;

    if (
      propSchema.type === undefined &&
      !propSchema.allOf &&
      !propSchema.anyOf &&
      !propSchema.oneOf
    ) {
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

  const resolvedOptions = useControlAppliedOptions({
    get control() {
      return input.control;
    },
  });
  const appliedOptions = $derived(resolvedOptions.value);

  const additionalPropertyItems = $derived<AdditionalPropertyType[]>(
    additionalKeys.map((propName) =>
      toAdditionalPropertyType(propName, control.schema, control.rootSchema),
    ),
  );

  const propertyIdentities = new PropertyIdentityStore();
  const propertyKeys = $derived(
    propertyIdentities.reconcile(additionalPropertyItems.map((item) => item.propertyName)),
  );

  let newPropertyName = $state<string>('');
  let newPropertyErrors = $state.raw<ErrorObject[] | undefined>(undefined);
  let additionalErrors = $state.raw<ErrorObject[]>([]);
  let renamingPropertyName = $state<string | null>(null);
  let renameValue = $state('');

  const propertyNameChange = (event: JsonFormsChangeEvent) => {
    newPropertyName = typeof event.data === 'string' ? event.data : '';
    let newAdditionalErrors: ErrorObject[] = [];
    const validation = validateAdditionalPropertyName({
      allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
      allowLiteralNames: true,
      name: newPropertyName,
      schema: control.schema,
      rootSchema: control.rootSchema,
      data: control.data,
      disallowedPropertyNames,
      ajv: jsonforms.core?.ajv,
    });

    // Keep the initial/reset empty draft quiet. Add validates independently.
    if (
      newPropertyName !== '' &&
      !validation.valid &&
      validation.error !== 'required' &&
      !validation.errors?.length
    ) {
      newAdditionalErrors = [
        {
          data: newPropertyName,
          instancePath: '',
          keyword: '',
          message:
            translations[
              validation.error === 'already-defined'
                ? AdditionalPropertiesTranslationEnum.propertyAlreadyDefined
                : AdditionalPropertiesTranslationEnum.propertyNameInvalid
            ]!,
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
      additionalPropertiesDefaultTranslations.map((entry) => ({
        key: entry.key,
        default: (value) =>
          message(additionalPropertyMessageKey(entry.key, value), {
            value,
            name: value,
            label: value,
          }),
      })),
      i18nAdditionalPropertiesPrefix,
      control.label,
      newPropertyName,
    ),
  );

  function propertyActionLabel(kind: 'rename' | 'remove', name: string): string {
    const catalogKey =
      kind === 'rename' ? 'additionalProperties.renameNamed' : 'additionalProperties.deleteNamed';
    return message(catalogKey, { name });
  }

  const propertyNameLabel = $derived(
    translations[AdditionalPropertiesTranslationEnum.propertyNameLabel],
  );

  const propertyNameUiSchema = $derived<ControlElement>({
    type: 'Control',
    scope: '#',
    label: propertyNameLabel,
  });

  const propertyNameSchema = $derived({
    ...createAdditionalPropertyNameSchema(control.schema, control.rootSchema),
    title: propertyNameLabel,
  });

  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const page = useCollectionPagination({
    get keys() {
      return additionalPropertyItems.map((item) => item.propertyName);
    },
    get local() {
      return (
        control.uischema.options?.additionalProperties as { pagination?: unknown } | undefined
      )?.pagination;
    },
    get config() {
      return control.config;
    },
    get errors() {
      return collectionErrorPositions(
        jsonforms.core,
        controlPathSegments,
        additionalPropertyItems.map((item) => item.propertyName),
      );
    },
    kind: 'additionalProperties',
  });
  const parentValidationMode = $derived(jsonforms.core?.validationMode);
  const i18n = $derived(jsonforms.i18n);
  const ajv = $derived(jsonforms.core?.ajv);
  const existingRenameSummary = useErrorSummary(() =>
    renamingPropertyName === null ? [] : (nameErrors.errors.get(renamingPropertyName) ?? []),
  );
  const nameConstraintMessage = useNameConstraintMessage();
  const renameValidation = $derived(
    renamingPropertyName === null
      ? null
      : validateAdditionalPropertyName({
          allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
          allowLiteralNames: true,
          name: renameValue,
          currentName: renamingPropertyName,
          schema: control.schema,
          rootSchema: control.rootSchema,
          data: control.data,
          disallowedPropertyNames,
          ajv,
        }),
  );
  const renameError = $derived.by(() => {
    if (renameValue === renamingPropertyName && existingRenameSummary.entries.length)
      return existingRenameSummary.entries.map((entry) => entry.message).join('\n');
    if (!renameValidation || renameValidation.valid) return null;
    return (
      nameConstraintMessage(renameValidation.errors) ??
      (renameValidation.error === 'required'
        ? message('additionalProperties.nameRequired')
        : renameValidation.error === 'already-defined'
          ? message('additionalProperties.nameTaken', { name: renameValidation.name })
          : message('additionalProperties.nameInvalid', { name: renameValidation.name }))
    );
  });

  // if the new property name is not specified then hide any errors
  const validationMode = $derived(newPropertyName ? parentValidationMode : 'ValidateAndHide');

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const maxPropertiesReached = $derived(
    control.schema.maxProperties !== undefined && // we have maxProperties constraint
      objectData && // we have object data to check
      // the current number of properties in the object is greater or equals to the maxProperties
      Object.keys(objectData).length >= control.schema.maxProperties,
  );

  const addPropertyDisabled = $derived(
    // add is disabled because the overall control is disabled
    !control.enabled ||
      control.readonly ||
      appliedOptions.disableAdd === true ||
      // add is disabled because of constraints
      (appliedOptions.restrict && maxPropertiesReached) ||
      // add is disabled because there are errors for the new property name or it is not specified
      (newPropertyErrors && newPropertyErrors.length > 0) ||
      (additionalErrors && additionalErrors.length > 0) ||
      !validateAdditionalPropertyName({
        allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
        allowLiteralNames: true,
        name: newPropertyName,
        schema: control.schema,
        rootSchema: control.rootSchema,
        data: control.data,
        disallowedPropertyNames,
        ajv,
      }).valid,
  );

  const minPropertiesReached = $derived(
    control.schema.minProperties !== undefined && // we have minProperties constraint
      objectData && // we have object data to check
      // the current number of properties in the object is less or equals to the minProperties
      Object.keys(objectData).length <= control.schema.minProperties,
  );

  const removePropertyDisabled = $derived(
    appliedOptions.disableRemove === true ||
      control.readonly ||
      // add is disabled because the overall control is disabled
      !control.enabled ||
      // add is disabled because of constraints
      (appliedOptions.restrict && minPropertiesReached),
  );

  const additionalPropertiesTitle = $derived.by(() => {
    const title = (control.schema.additionalProperties as JsonSchema7)?.title;
    return title ? t.value(title, title) : title;
  });

  // Methods
  function addProperty() {
    return command(() => !addPropertyDisabled, appendProperty);
  }
  function appendProperty() {
    if (!addPropertyDisabled) {
      const validation = validateAdditionalPropertyName({
        allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
        allowLiteralNames: true,
        name: newPropertyName,
        schema: control.schema,
        rootSchema: control.rootSchema,
        data: control.data,
        disallowedPropertyNames,
        ajv,
      });
      if (!validation.valid) return;

      const propertyName = validation.name;
      const additionalProperty = toAdditionalPropertyType(
        propertyName,
        control.schema,
        control.rootSchema,
      );
      const updatedData = objectData ? { ...objectData } : {};

      Object.defineProperty(updatedData, propertyName, {
        value: createDefaultValue(additionalProperty.schema, control.rootSchema),
        enumerable: true,
        configurable: true,
        writable: true,
      });

      // Always preserve the key even when its value is "empty".
      input.handleChange(control.path, updatedData);
    }
    newPropertyName = '';
  }

  const deletion = useDeletionConfirmation(
    () => ({
      ...control,
      options: control.uischema.options,
    }),
    'additionalProperties',
    () => page.prepare(),
  );

  function removeProperty(propName: string): void {
    const allowed = () =>
      !removePropertyDisabled &&
      Object.hasOwn(control.data ?? {}, propName) &&
      !(appliedOptions.restrict && control.schema.required?.includes(propName));
    deletion.request(
      () => [control.data[propName]],
      () => {
        const updatedData = { ...control.data };
        delete updatedData[propName];
        input.handleChange(control.path, updatedData);
      },
      allowed,
    );
  }

  const owner = () => [control.path, control.schema, control.rootSchema];
  let renameOwner = $state.raw<unknown[] | undefined>();
  let renameComposing = $state(false);
  const canRename = (name: string) =>
    control.enabled &&
    !control.readonly &&
    control.visible &&
    Object.hasOwn(control.data ?? {}, name) &&
    !(appliedOptions.restrict && control.schema.required?.includes(name));

  let renameTrigger: HTMLButtonElement | HTMLAnchorElement | undefined;

  function openRenameDialog(propName: string, trigger: HTMLButtonElement | HTMLAnchorElement) {
    return command(
      () => canRename(propName),
      () => {
        renameTrigger = trigger;
        renameOwner = cloneDeep(owner());
        renamingPropertyName = propName;
        renameValue = propName;
      },
    );
  }

  $effect(() => {
    if (
      renamingPropertyName !== null &&
      (!canRename(renamingPropertyName) || !isEqual(owner(), renameOwner))
    ) {
      closeRenameDialog();
    }
  });

  function closeRenameDialog(): void {
    renamingPropertyName = null;
    renameValue = '';
    renameComposing = false;
    renameOwner = undefined;
  }

  function commitRename(event: SubmitEvent): void {
    event.preventDefault();
    const source = renamingPropertyName;
    const proposed = renameValue;
    void command(
      () =>
        source !== null &&
        source === renamingPropertyName &&
        proposed === renameValue &&
        !renameComposing &&
        !renameError &&
        canRename(source) &&
        isEqual(owner(), renameOwner),
      renameProperty,
    );
  }

  function renameProperty(): void {
    if (renamingPropertyName === null) return;

    const validation = validateAdditionalPropertyName({
      allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
      allowLiteralNames: true,
      name: renameValue,
      currentName: renamingPropertyName,
      schema: control.schema,
      rootSchema: control.rootSchema,
      data: control.data,
      disallowedPropertyNames,
      ajv,
    });
    if (validation.valid && validation.name === renamingPropertyName) {
      closeRenameDialog();
      return;
    }
    if (!validation.valid) {
      return;
    }
    const renamedProperty = validation.name;

    if (typeof control.data === 'object' && control.data !== null && !Array.isArray(control.data)) {
      const updatedData = Object.fromEntries(
        Object.entries(control.data).map(([key, value]) => [
          key === renamingPropertyName ? renamedProperty : key,
          value,
        ]),
      );
      const previousName = renamingPropertyName;
      input.handleChange(control.path, updatedData);
      if (
        Object.hasOwn(control.data ?? {}, renamedProperty) &&
        !Object.hasOwn(control.data ?? {}, previousName)
      )
        propertyIdentities.rename(previousName, renamedProperty);
      closeRenameDialog();
    }
  }
</script>

{#if control.visible}
  {#if rejected.message}
    <div class="flex items-center gap-2" data-additional-property-heading>
      <span>{message('additionalProperties.title')}</span>
      <SectionIndicators
        uischema={control.uischema}
        path={control.path}
        pathSegments={control.pathSegments}
        errorMessage={rejected.message}
        errorErrors={rejected.errors}
        errorSource="additionalProperties"
        showData={false}
      />
    </div>
  {/if}
  <Card.Root
    data-additional-properties
    data-embedded={embedded}
    class={`my-1 min-w-full ${embedded ? 'gap-0 border-0 bg-transparent py-0 shadow-none ring-0' : ''}`}
    {...shadcnProps('card')}
  >
    <div class="ps-4 pe-4 pt-2 pb-2">
      <div class="flex flex-col gap-2 md:flex-row md:gap-4">
        {#if additionalPropertiesTitle}
          <div class="md:flex md:h-10 md:items-center md:pt-6">
            <span class="text-foreground text-sm">{additionalPropertiesTitle}</span>
          </div>
        {/if}
        <div class="min-w-0 flex-1">
          <div class="property-name-row">
            <div class="property-name-control">
              <JsonForms
                data={newPropertyName}
                uischema={propertyNameUiSchema}
                schema={propertyNameSchema}
                {additionalErrors}
                renderers={control.renderers}
                cells={control.cells}
                config={control.config}
                readonly={!control.enabled || control.readonly}
                {validationMode}
                {i18n}
                {ajv}
                onchange={propertyNameChange}
              />
            </div>
            <div class="col-start-2 row-start-2 self-center justify-self-end">
              <TupleAction
                kind="add"
                label={translations.addTooltip ?? message('additionalProperties.add')}
                ariaLabel={translations.addAriaLabel ?? message('additionalProperties.add')}
                disabled={addPropertyDisabled}
                onclick={addProperty}
              >
                {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
              </TupleAction>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2 ps-4 pe-4 pb-4">
      {#each page.indices.map((index) => additionalPropertyItems[index]) as element (propertyKeys.get(element.propertyName))}
        {#if element.uischema}
          {@const errors = nameErrors.errors.get(element.propertyName)}
          <div
            data-additional-property-row
            class={nameErrors.errors.has(element.propertyName)
              ? 'property-name-invalid text-destructive relative'
              : 'relative'}
          >
            {#snippet nameErrorMarker()}
              {#if errors}
                <span data-property-name-error><ValidationIcon {errors} showCount={false} /></span>
              {/if}
            {/snippet}
            {#if control.enabled}
              <div class="absolute end-1 top-0 z-20 flex items-center gap-1">
                <TupleAction
                  kind="add"
                  label={translations.renameTooltip ?? message('additionalProperties.rename')}
                  ariaLabel={propertyActionLabel('rename', element.propertyName)}
                  buttonVariant="ghost"
                  buttonSize="icon-xs"
                  buttonClass="text-muted-foreground"
                  onclick={(event) =>
                    openRenameDialog(
                      element.propertyName,
                      event.currentTarget as HTMLButtonElement,
                    )}
                  disabled={!canRename(element.propertyName)}
                >
                  {#snippet icon()}<PenOutline class="h-4 w-4" />{/snippet}
                </TupleAction>
                <TupleAction
                  kind="delete"
                  label={appliedOptions.restrict &&
                  control.schema.required?.includes(element.propertyName)
                    ? message('additionalProperties.deleteBlocked')
                    : (translations.removeTooltip ?? message('additionalProperties.delete'))}
                  ariaLabel={propertyActionLabel('remove', element.propertyName)}
                  buttonVariant="destructive"
                  buttonSize="icon-xs"
                  disabled={removePropertyDisabled ||
                    (appliedOptions.restrict &&
                      control.schema.required?.includes(element.propertyName))}
                  onclick={() => removeProperty(element.propertyName)}
                >
                  {#snippet icon()}<TrashBinOutline class="h-4 w-4" />{/snippet}
                </TupleAction>
              </div>
            {/if}

            <LiteralControl
              existingOnly
              preservePropertyOnClear
              labelAccessory={nameErrorMarker}
              identity={propertyKeys.get(element.propertyName)}
              schema={{
                type: 'object',
                properties: { [element.propertyName]: element.schema },
                required: control.schema.required,
              } as JsonSchema}
              uischema={{
                ...(element.uischema.type === 'Control'
                  ? element.uischema
                  : { type: 'Control', options: { detail: element.uischema } }),
                scope:
                  '#/properties/' +
                  element.propertyName.replaceAll('~', '~0').replaceAll('/', '~1'),
                label: element.propertyName === '' ? '\u00a0' : element.propertyName,
              } as ControlElement}
              path={control.path}
              enabled={control.enabled && !control.readonly}
              renderers={control.renderers}
              cells={control.cells}
            />
          </div>
        {/if}
      {/each}
    </div>
    <CollectionPager {page} />
  </Card.Root>
{/if}

<Dialog.Root
  open={renamingPropertyName !== null}
  onOpenChange={(open) => !open && closeRenameDialog()}
>
  <LocalizedDialogContent
    portalProps={{ to: getPortalTarget() }}
    class="max-w-sm"
    closeLabel={message('dialog.close')}
    onCloseAutoFocus={(event) => {
      event.preventDefault();
      const trigger = renameTrigger;
      renameTrigger = undefined;
      if (trigger?.isConnected && !trigger.matches(':disabled'))
        trigger.focus({ preventScroll: true });
    }}
  >
    <Dialog.Title class="text-lg font-semibold">
      {translations.renameDialogTitle}
    </Dialog.Title>
    <Dialog.Description class="mb-4">{translations.renameDialogDescription}</Dialog.Description>
    <form onsubmit={commitRename}>
      <Label for={control.id + '-rename-property'} class="mb-2 block">
        {translations.renamePropertyNameLabel}
      </Label>
      <InputControl
        id={control.id + '-rename-property'}
        placeholder={message('additionalProperties.namePlaceholder')}
        bind:value={renameValue}
        oncompositionstart={() => (renameComposing = true)}
        oncompositionend={() => (renameComposing = false)}
        aria-invalid={renameError ? 'true' : undefined}
        aria-describedby={renameError ? control.id + '-rename-error' : undefined}
      />
      {#if renameError}
        <p id={control.id + '-rename-error'} class="text-destructive mt-2 text-sm" role="alert">
          {renameError}
        </p>
      {/if}
      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onclick={closeRenameDialog}>
          {translations.renameDialogDecline}
        </Button>
        <Button type="submit" disabled={!!renameError || renameComposing}>
          {translations.renameDialogAccept}
        </Button>
      </div>
    </form>
  </LocalizedDialogContent>
</Dialog.Root>

{#if deletion.pending && control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}

<style>
  :global(
    [data-additional-property-row]
      > [data-slot='field']
      > div:first-child
      > [data-slot='field-label']
  ) {
    max-width: calc(100% - 5rem);
    overflow-wrap: anywhere;
  }
  :global(
    [data-additional-property-row]
      > [data-slot='field']
      > div:first-child
      > [data-slot='field-label']
      > span:first-child
  ) {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .property-name-invalid :global(label) {
    color: var(--color-destructive, #dc2626) !important;
  }
  .property-name-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 1rem;
  }

  /* Share the input row with the action, independently of label/help text height. */
  .property-name-control,
  .property-name-control :global(> div:has(> [data-slot='field'])),
  .property-name-control :global(> [data-slot='field']) {
    display: contents;
  }

  .property-name-control :global(> div > [data-slot='field']) {
    display: contents;
  }

  .property-name-control :global(> *),
  .property-name-control :global([data-slot='field'] > *) {
    grid-column: 1;
    grid-row: 2;
    margin-block: 0;
  }

  .property-name-control :global([data-slot='field'] > label) {
    grid-row: 1;
    margin-bottom: 0.5rem;
  }

  .property-name-control :global([data-slot='field'] > p) {
    grid-row: 3;
    margin-top: 0.5rem;
  }
</style>
