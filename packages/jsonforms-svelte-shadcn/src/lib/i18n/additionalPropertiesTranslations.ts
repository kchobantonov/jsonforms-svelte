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

export const additionalPropertiesDefaultTranslations: AdditionalPropertiesDefaultTranslation[] = [
  {
    key: AdditionalPropertiesTranslationEnum.addTooltip,
    default: (input) => (input ? `Add to ${input}` : 'Add'),
  },
  {
    key: AdditionalPropertiesTranslationEnum.addAriaLabel,
    default: (input) => (input ? `Add to ${input} button` : 'Add button'),
  },
  {
    key: AdditionalPropertiesTranslationEnum.renameTooltip,
    default: () => 'Rename',
  },
  {
    key: AdditionalPropertiesTranslationEnum.renameAriaLabel,
    default: () => 'Rename button',
  },
  {
    key: AdditionalPropertiesTranslationEnum.renameDialogTitle,
    default: () => 'Rename property',
  },
  {
    key: AdditionalPropertiesTranslationEnum.renameDialogAccept,
    default: () => 'Rename',
  },
  {
    key: AdditionalPropertiesTranslationEnum.renameDialogDecline,
    default: () => 'Cancel',
  },
  {
    key: AdditionalPropertiesTranslationEnum.renamePropertyNameLabel,
    default: () => 'New property name',
  },
  {
    key: AdditionalPropertiesTranslationEnum.removeTooltip,
    default: () => 'Delete',
  },
  {
    key: AdditionalPropertiesTranslationEnum.removeAriaLabel,
    default: () => 'Delete button',
  },
  {
    key: AdditionalPropertiesTranslationEnum.propertyNameLabel,
    default: () => 'Property Name',
  },
  {
    key: AdditionalPropertiesTranslationEnum.propertyNameInvalid,
    default: (input) =>
      input ? `Property name '${input}' is invalid` : 'Property name is invalid',
  },
  {
    key: AdditionalPropertiesTranslationEnum.propertyAlreadyDefined,
    default: (input) =>
      input ? `Property '${input}' already defined` : 'Property already defined',
  },
];
