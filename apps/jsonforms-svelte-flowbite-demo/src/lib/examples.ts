import { getExamples, registerExamples } from '@jsonforms/examples';

import { default as extendedControlOptions } from './examples/extended-control-options/index.js';
import { default as main } from './examples/main/index.js';

registerExamples(extendedControlOptions);
registerExamples(main);

const examples = getExamples();

export default examples;
