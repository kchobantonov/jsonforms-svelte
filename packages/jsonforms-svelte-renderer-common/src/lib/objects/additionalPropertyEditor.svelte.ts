import {
  useJsonForms,
  useTranslator,
  type JsonFormsChangeEvent,
} from '@chobantonov/jsonforms-svelte';
import {
  createDefaultValue,
  getI18nKeyPrefix,
  type ControlElement,
  type JsonSchema7,
} from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import type { useJsonFormsControlWithDetail } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import {
  additionalPropertyMessageKey,
  getAdditionalPropertiesTranslations,
  AdditionalPropertiesTranslationEnum,
  type AdditionalPropertiesDefaultTranslation,
} from '../locale/additionalPropertiesTranslations';
import { useDeletionConfirmation } from '../interaction/deletionConfirmation.svelte';
import { useCollectionAction } from '../collections/collectionAction.svelte';
import { useAdditionalPropertyCollection } from './additionalPropertyCollection.svelte';
import {
  createAdditionalPropertyNameSchema,
  validateAdditionalPropertyName,
} from './additionalPropertyName';

export function useAdditionalPropertyEditor(
  getInput: () => ReturnType<typeof useJsonFormsControlWithDetail>,
  getOptions: () => Record<string, unknown>,
  getDisallowedNames: () => string[],
  additionalPropertiesDefaultTranslations: AdditionalPropertiesDefaultTranslation[],
) {
  const input = $derived(getInput());
  const control = $derived(input.control);
  const appliedOptions = $derived(getOptions());
  let newPropertyName = $state<string>('');
  let newPropertyErrors = $state.raw<ErrorObject[] | undefined>(undefined);
  let additionalErrors = $state.raw<ErrorObject[]>([]);
  function validateName(name: string, currentName?: string) {
    return validateAdditionalPropertyName({
      name,
      currentName,
      allowEmptyPropertyNames: appliedOptions.allowEmptyPropertyNames === true,
      allowLiteralNames: true,
      schema: control.schema,
      rootSchema: control.rootSchema,
      data: control.data,
      disallowedPropertyNames: getDisallowedNames(),
      ajv: jsonforms.core?.ajv,
    });
  }

  function shouldShowDraftError(
    validation: ReturnType<typeof validateName>,
  ): validation is Exclude<ReturnType<typeof validateName>, { valid: true }> {
    return newPropertyName !== '' && !validation.valid && validation.error !== 'required';
  }

  function draftNameErrors(validation: ReturnType<typeof validateName>): ErrorObject[] {
    // Keep the initial/reset empty draft quiet. Add validates independently.
    if (shouldShowDraftError(validation) && !validation.errors?.length) {
      return [
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

    return [];
  }

  const propertyNameChange = (event: JsonFormsChangeEvent) => {
    newPropertyName = typeof event.data === 'string' ? event.data : '';
    const validation = validateName(newPropertyName);
    const newAdditionalErrors = draftNameErrors(validation);

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
  const collection = useAdditionalPropertyCollection(() => control, getDisallowedNames);
  const { page } = collection;
  const parentValidationMode = $derived.by(() => jsonforms.core?.validationMode);
  const i18n = $derived(jsonforms.i18n);
  const ajv = $derived.by(() => jsonforms.core?.ajv);
  // if the new property name is not specified then hide any errors
  const validationMode = $derived.by(() =>
    newPropertyName ? parentValidationMode : 'ValidateAndHide',
  );

  const maxPropertiesReached = $derived.by(
    () =>
      control.schema.maxProperties !== undefined && // we have maxProperties constraint
      collection.objectData && // we have object data to check
      // the current number of properties in the object is greater or equals to the maxProperties
      Object.keys(collection.objectData).length >= control.schema.maxProperties,
  );

  const propertyDraftInvalid = $derived.by(
    () =>
      Boolean(newPropertyErrors?.length) ||
      additionalErrors.length > 0 ||
      !validateName(newPropertyName).valid,
  );
  const addPropertyDisabled = $derived.by(
    () =>
      !control.enabled ||
      control.readonly ||
      appliedOptions.disableAdd === true ||
      addLimitReached ||
      propertyDraftInvalid,
  );
  const addLimitReached = $derived.by(() => !!appliedOptions.restrict && maxPropertiesReached);

  const minPropertiesReached = $derived.by(
    () =>
      control.schema.minProperties !== undefined && // we have minProperties constraint
      collection.objectData && // we have object data to check
      // the current number of properties in the object is less or equals to the minProperties
      Object.keys(collection.objectData).length <= control.schema.minProperties,
  );

  const removePropertyDisabled = $derived.by(
    () =>
      appliedOptions.disableRemove === true ||
      control.readonly ||
      // add is disabled because the overall control is disabled
      !control.enabled ||
      // add is disabled because of constraints
      (!!appliedOptions.restrict && minPropertiesReached),
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
      const validation = validateName(newPropertyName);
      if (!validation.valid) return;

      const propertyName = validation.name;
      const additionalProperty = collection.itemForName(propertyName);
      const updatedData = collection.objectData ? { ...collection.objectData } : {};

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
      !(!!appliedOptions.restrict && control.schema.required?.includes(propName));
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

  const command = useCollectionAction(
    () => control,
    () => page.prepare(),
  );

  return {
    command,
    collection,
    page,
    message,
    deletion,
    validateName,
    propertyActionLabel,
    propertyNameChange,
    addProperty,
    removeProperty,
    get additionalPropertiesTitle() {
      return additionalPropertiesTitle;
    },
    get newPropertyName() {
      return newPropertyName;
    },
    get propertyNameUiSchema() {
      return propertyNameUiSchema;
    },
    get propertyNameSchema() {
      return propertyNameSchema;
    },
    get additionalErrors() {
      return additionalErrors;
    },
    get validationMode() {
      return validationMode;
    },
    get i18n() {
      return i18n;
    },
    get ajv() {
      return ajv;
    },
    get addPropertyDisabled() {
      return addPropertyDisabled;
    },
    get removePropertyDisabled() {
      return removePropertyDisabled;
    },
    get translations() {
      return translations;
    },
  };
}
