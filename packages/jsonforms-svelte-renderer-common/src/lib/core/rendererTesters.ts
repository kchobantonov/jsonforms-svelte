import {
  Resolve,
  isBooleanControl,
  isDateControl,
  isDateTimeControl,
  isEnumControl,
  isIntegerControl,
  isMultiLineControl,
  isNumberControl,
  isOneOfEnumControl,
  isRangeControl,
  isTimeControl,
  type JsonFormsCellRendererRegistryEntry,
  and,
  categorizationHasCategory,
  formatIs,
  isAllOfControl,
  isCategorization,
  isObjectControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  type ControlElement,
  type RankedTester,
  uiTypeIs,
} from '@jsonforms/core';
import { conditionalFieldsEnabled, hasConditionalFields } from '../objects/conditionalFields';
import { stringSuggestions } from '../controls/enumChoices';

export const objectTester: RankedTester = (ui, schema, context) => {
  const object = isObjectControl(ui, schema, context);
  const allOf = isAllOfControl(ui, schema, context);
  if (!object && !allOf) return -1;
  if (conditionalFieldsEnabled(ui, context.config)) {
    try {
      const scoped = Resolve.schema(schema, (ui as ControlElement).scope, context.rootSchema);
      if (
        scoped &&
        (object || scoped.type === 'object') &&
        hasConditionalFields(scoped, new Set(), context.rootSchema)
      )
        return 25;
    } catch {
      // The form-level reference diagnostic owns failed resolution.
    }
  }
  return object ? 2 : -1;
};

export const stringMaskTester: RankedTester = rankWith(
  2,
  and(isStringControl, (uischema, schema, context) => {
    // Format-specific editors own these values even when a mask is also configured.
    if (
      ['date', 'time', 'date-time', 'color', 'password', 'duration', 'byte', 'binary'].some(
        (format) => formatIs(format)(uischema, schema, context),
      ) ||
      schemaMatches(
        (candidate) =>
          candidate.type === 'string' &&
          'contentEncoding' in candidate &&
          candidate.contentEncoding === 'base64',
      )(uischema, schema, context) ||
      uischema.options?.format === 'password'
    ) {
      return false;
    }
    const mask = uischema.options?.mask;
    return (
      typeof mask === 'string' ||
      typeof mask === 'function' ||
      (Array.isArray(mask) && mask.every((item) => typeof item === 'string'))
    );
  }),
);

export const passwordTester: RankedTester = rankWith(
  4,
  and(isStringControl, or(formatIs('password'), optionIs('format', 'password'))),
);

export const stringSuggestionsTester: RankedTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema, rootSchema) => stringSuggestions(schema, rootSchema) !== undefined),
  ),
);

export const categorizationStepperTester: RankedTester = rankWith(
  3,
  and(isCategorization, categorizationHasCategory, optionIs('variant', 'stepper')),
);

export const controlTesters = {
  boolean: rankWith(1, isBooleanControl),
  booleanToggle: rankWith(3, and(isBooleanControl, optionIs('toggle', true))),
  date: rankWith(2, and(isStringControl, isDateControl)),
  dateTime: rankWith(2, and(isStringControl, isDateTimeControl)),
  enum: rankWith(2, isEnumControl),
  integer: rankWith(1, isIntegerControl),
  multiString: rankWith(2, and(isStringControl, isMultiLineControl)),
  number: rankWith(1, isNumberControl),
  oneOfEnum: rankWith(5, isOneOfEnumControl),
  oneOfRadioGroup: rankWith(20, and(isOneOfEnumControl, optionIs('format', 'radio'))),
  radioGroup: rankWith(20, and(isEnumControl, optionIs('format', 'radio'))),
  slider: rankWith(4, isRangeControl),
  string: rankWith(1, isStringControl),
  time: rankWith(2, and(isStringControl, isTimeControl)),
};

export function specializedCellEntries(cell: JsonFormsCellRendererRegistryEntry['cell']) {
  const entry = (tester: RankedTester): JsonFormsCellRendererRegistryEntry => ({ cell, tester });
  return {
    anyOfStringOrEnumCellEntry: entry(stringSuggestionsTester),
    booleanToggleCellEntry: entry(controlTesters.booleanToggle),
    multiStringCellEntry: entry(controlTesters.multiString),
    oneOfRadioGroupCellEntry: entry(controlTesters.oneOfRadioGroup),
    passwordCellEntry: entry(passwordTester),
    radioGroupCellEntry: entry(controlTesters.radioGroup),
    sliderCellEntry: entry(controlTesters.slider),
    stringMaskCellEntry: entry(stringMaskTester),
  };
}
