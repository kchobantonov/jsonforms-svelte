import { getExamples, registerExamples, type ExampleDescription } from '@jsonforms/examples';

import { default as extendedControlOptions } from './examples/extended-control-options/index.js';
import { default as main } from './examples/main/index.js';
import type { JsonFormsI18nState } from '@jsonforms/core';

registerExamples(extendedControlOptions);
registerExamples(main);

const examples = getExamples() as (ExampleDescription & {
  i18n?: JsonFormsI18nState & { translations?: Record<string, unknown> };
})[];

export default examples;
