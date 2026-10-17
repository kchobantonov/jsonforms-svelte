import { rendererMessage } from '@chobantonov/jsonforms-svelte';
export interface AdditionalPropertiesDefaultTranslation {
  key: AdditionalPropertiesTranslationEnum;
  default: (variable?: string | null) => string;
}

export enum AdditionalPropertiesTranslationEnum {
  addTooltip = 'addTooltip',
  addAriaLabel = 'addAriaLabel',
  renameTooltip = 'renameTooltip',
  renameAriaLabel = 'renameAriaLabel',
  renameDialogTitle = 'renameDialogTitle',
  renameDialogAccept = 'renameDialogAccept',
  renameDialogDecline = 'renameDialogDecline',
  renamePropertyNameLabel = 'renamePropertyNameLabel',
  removeTooltip = 'removeTooltip',
  removeAriaLabel = 'removeAriaLabel',
  propertyNameLabel = 'propertyNameLabel',
  propertyNameInvalid = 'propertyNameInvalid',
  propertyAlreadyDefined = 'propertyAlreadyDefined',
}

export type AdditionalPropertiesTranslations = {
  [key in AdditionalPropertiesTranslationEnum]?: string;
};

export const additionalPropertyMessageKey = (
  key: AdditionalPropertiesTranslationEnum,
  value?: string | null,
) =>
  'additionalProperties.' +
  key +
  (value &&
  ['addTooltip', 'addAriaLabel', 'propertyNameInvalid', 'propertyAlreadyDefined'].includes(key)
    ? 'WithValue'
    : '');

export const additionalPropertiesDefaultTranslations: AdditionalPropertiesDefaultTranslation[] =
  Object.values(AdditionalPropertiesTranslationEnum).map((key) => ({
    key,
    default: (value) =>
      rendererMessage(undefined, additionalPropertyMessageKey(key, value)).replaceAll(
        '{value}',
        value ?? '',
      ),
  }));
