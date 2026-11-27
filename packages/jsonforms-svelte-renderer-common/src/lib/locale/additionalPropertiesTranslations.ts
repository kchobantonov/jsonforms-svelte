import { addI18nKeyToPrefix, type Translator } from '@jsonforms/core';
import { rendererMessage } from './rendererMessages';
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
  renameDialogDescription = 'renameDialogDescription',
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
) => {
  if (key === AdditionalPropertiesTranslationEnum.renameDialogDecline) return 'combinator.cancel';
  if (
    key === AdditionalPropertiesTranslationEnum.addTooltip ||
    key === AdditionalPropertiesTranslationEnum.addAriaLabel
  )
    return value ? 'additionalProperties.addTo' : 'additionalProperties.add';
  if (key === AdditionalPropertiesTranslationEnum.renameTooltip)
    return 'additionalProperties.rename';
  if (key === AdditionalPropertiesTranslationEnum.removeTooltip)
    return 'additionalProperties.delete';
  return (
    'additionalProperties.' +
    (key === AdditionalPropertiesTranslationEnum.renameDialogTitle
      ? 'renameTitle'
      : key === AdditionalPropertiesTranslationEnum.renameDialogAccept
        ? 'renameConfirm'
        : key === AdditionalPropertiesTranslationEnum.propertyAlreadyDefined && value
          ? 'nameTaken'
          : key === AdditionalPropertiesTranslationEnum.propertyNameInvalid && value
            ? 'nameInvalid'
            : key)
  );
};

export const createAdditionalPropertiesDefaultTranslations =
  (): AdditionalPropertiesDefaultTranslation[] =>
    Object.values(AdditionalPropertiesTranslationEnum).map((key) => ({
      key,
      default: (value) =>
        rendererMessage(undefined, additionalPropertyMessageKey(key, value))
          .replaceAll('{value}', value ?? '')
          .replaceAll('{label}', value ?? '')
          .replaceAll('{name}', value ?? ''),
    }));

export const getAdditionalPropertiesTranslations = (
  t: Translator,
  defaultTranslations: AdditionalPropertiesDefaultTranslation[],
  i18nKeyPrefix: string,
  label: string,
  propertyName: string | null,
): AdditionalPropertiesTranslations => {
  const translations: AdditionalPropertiesTranslations = {};
  defaultTranslations.forEach((controlElement) => {
    const key = addI18nKeyToPrefix(i18nKeyPrefix, controlElement.key);

    const context =
      controlElement.key === AdditionalPropertiesTranslationEnum.propertyAlreadyDefined ||
      controlElement.key === AdditionalPropertiesTranslationEnum.propertyNameInvalid
        ? propertyName
        : label;
    translations[controlElement.key] = t(key, controlElement.default(context), context);
  });
  return translations;
};
