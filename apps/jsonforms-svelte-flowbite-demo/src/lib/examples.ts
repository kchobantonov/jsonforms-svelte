import { getExamples, registerExamples, type ExampleDescription } from '@jsonforms/examples';

import type { JsonFormsI18nState } from '@jsonforms/core';

import { default as combinatorProperties } from './examples/combinator-properties/index.js';
import { default as extendedControlOptions } from './examples/extended-control-options/index.js';
import { default as main } from './examples/main/index.js';

registerExamples(extendedControlOptions);
registerExamples(main);
registerExamples(combinatorProperties);

const examples = getExamples() as (ExampleDescription & {
  i18n?: JsonFormsI18nState & { translations?: Record<string, unknown> };
})[];

export default examples;
