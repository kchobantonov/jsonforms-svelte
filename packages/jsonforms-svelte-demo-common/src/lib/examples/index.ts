import { getExamples } from '@jsonforms/examples';
import { createButtonExample } from './button/index.js';
import { createCombinatorPropertiesExample } from './combinator-properties/index.js';
import { createDurationExample } from './duration/index.js';
import { createErrorMessageExample } from './error-message/index.js';
import {
  createExtendedControlOptionsExample,
} from './extended-control-options/index.js';
import { createFileExample } from './file/index.js';
import {
  type DemoExample,
  type DemoExamplesVariant,
} from './definitions.js';
import { createJobExample } from './job/index.js';
import { createMainExample } from './main/index.js';
import { createNullControlExample } from './null-control/index.js';
import { createSplitLayoutExample } from './split-layout/index.js';
import { createTemplateLayoutExample } from './template-layout/index.js';
import { createTemplateSlotExample } from './template-slot/index.js';

export type { DemoExample, DemoExamplesVariant } from './definitions.js';

export const createDemoExamples = (
  variant: DemoExamplesVariant,
  getLocale: () => string,
): DemoExample[] => {
  const customExamples: DemoExample[] = [
    createButtonExample(getLocale),
    createCombinatorPropertiesExample(),
    createDurationExample(),
    createErrorMessageExample(getLocale),
    createExtendedControlOptionsExample(variant),
    createNullControlExample(),
    createSplitLayoutExample(),
    createTemplateLayoutExample(getLocale),
    createTemplateSlotExample(),
    createFileExample(getLocale),
    createJobExample(getLocale),
    createMainExample(getLocale),
  ];

  const builtinExamples = getExamples() as DemoExample[];
  const mergedExamples = [...builtinExamples, ...customExamples];
  const uniqueByName = new Map(mergedExamples.map((example) => [example.name, example]));

  return Array.from(uniqueByName.values()).sort((a, b) => a.label.localeCompare(b.label));
};

export const createSkeletonDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('skeleton', getLocale);

export const createFlowbiteDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('flowbite', getLocale);
