import type { BaseUISchemaElement, JsonSchema } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import type { DemoActionEvent } from '../actions.js';
import { changeLang } from '../button/actions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplementalTranslations from './supplemental-translations.json';

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 750));
const buttonKeys: Record<string, string> = {
  Unavailable: 'unavailable',
  'Submit slowly': 'slowButton',
  'Declares neither': 'neitherButton',
  'Log the form data': 'logButton',
  'Declares both': 'bothButton',
};
type DemoElement = BaseUISchemaElement & {
  label?: string;
  i18n?: string;
  name?: string;
  elements?: DemoElement[];
  params?: Record<string, unknown>;
  script?: string | ((this: DemoActionEvent, event: DemoActionEvent) => void | Promise<void>);
};
function adapt(element: DemoElement): DemoElement {
  const result = { ...element };
  const label = (element as { label?: string }).label;
  if (label && Object.hasOwn(buttonKeys, label)) result.i18n = buttonKeys[label];
  if (Array.isArray(element.elements)) result.elements = element.elements.map(adapt);
  // Platform context spelling only; the canonical JSON remains untouched.
  if (element.type === 'Button' && element.script === 'console.log(this.context.core.data);') {
    result.script = 'console.log(this.context.data);';
  }
  if (element.type === 'Categorization') {
    result.elements = [
      ...(result.elements ?? []),
      {
        type: 'Category',
        name: 'native',
        label: 'TypeScript',
        i18n: 'typescriptTab',
        elements: [
          { type: 'Label', i18n: 'typescript' },
          {
            type: 'Button',
            i18n: 'nativeArrow',
            params: { tier: 'express' },
            script: (event: DemoActionEvent) => console.log(event.params),
          },
          {
            type: 'Button',
            i18n: 'nativeClassic',
            params: { tier: 'standard' },
            script: function (this: DemoActionEvent) {
              console.log(this.params);
            },
          },
          {
            type: 'Button',
            i18n: 'nativeAsync',
            script: async (event: DemoActionEvent) => {
              await delay();
              console.log(event.params);
            },
          },
        ],
      },
    ];
  }
  return result;
}
export const createSpecButtonActionsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-button-actions',
      label: 'Spec: Button actions',
      schema: schema as JsonSchema,
      uischema: adapt(uischema as DemoElement),
      data,
      config,
      onHandleAction(event) {
        if (event.action === 'setLocale') event.callback = changeLang;
        else if (event.action === 'reset')
          event.callback = (source) => {
            source.context.data = { ...data };
          };
        else if (event.action === 'discard')
          event.callback = (source) => {
            source.context.data = {};
          };
        else
          event.callback = async (source) => {
            if (source.action === 'slowExample') await delay();
            console.log(source.action, source.context.data);
          };
      },
    },
    mergeExampleTranslations(translations, supplementalTranslations),
    getLocale,
  );
