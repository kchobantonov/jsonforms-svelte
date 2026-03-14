import type { Translator } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  additionalPropertiesDefaultTranslations,
  AdditionalPropertiesTranslationEnum,
} from '../../src/lib/i18n/additionalPropertiesTranslations';
import { getAdditionalPropertiesTranslations } from '../../src/lib/i18n/i18nUtil';

describe('i18n/i18nUtil', () => {
  it('uses propertyName for name-specific translations and label for generic ones', () => {
    const calls: Array<{ key: string; context: string | undefined }> = [];
    const translator: Translator = ((key, defaultMessage, context) => {
      calls.push({ key, context });
      return `${key}::${defaultMessage}`;
    }) as Translator;

    const result = getAdditionalPropertiesTranslations(
      translator,
      additionalPropertiesDefaultTranslations,
      'jsonforms.skeleton',
      'Address',
      'zip',
    );

    expect(calls).toHaveLength(additionalPropertiesDefaultTranslations.length);

    const callByKey = Object.fromEntries(
      calls.map((call) => [call.key.split('.').pop() as AdditionalPropertiesTranslationEnum, call]),
    );

    expect(callByKey[AdditionalPropertiesTranslationEnum.addTooltip].context).toBe('Address');
    expect(callByKey[AdditionalPropertiesTranslationEnum.propertyNameInvalid].context).toBe('zip');
    expect(callByKey[AdditionalPropertiesTranslationEnum.propertyAlreadyDefined].context).toBe(
      'zip',
    );

    expect(result[AdditionalPropertiesTranslationEnum.addTooltip]).toContain('Add to Address');
    expect(result[AdditionalPropertiesTranslationEnum.propertyAlreadyDefined]).toContain(
      "Property 'zip' already defined",
    );
  });

  it('falls back to default messages when propertyName is null', () => {
    const translator: Translator = ((_, defaultMessage) => defaultMessage) as Translator;

    const result = getAdditionalPropertiesTranslations(
      translator,
      additionalPropertiesDefaultTranslations,
      'jsonforms.skeleton',
      'Order',
      null,
    );

    expect(result[AdditionalPropertiesTranslationEnum.addTooltip]).toBe('Add to Order');
    expect(result[AdditionalPropertiesTranslationEnum.propertyNameInvalid]).toBe(
      'Property name is invalid',
    );
    expect(result[AdditionalPropertiesTranslationEnum.propertyAlreadyDefined]).toBe(
      'Property already defined',
    );
  });
});
