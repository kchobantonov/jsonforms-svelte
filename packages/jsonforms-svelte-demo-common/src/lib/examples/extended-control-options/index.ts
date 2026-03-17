import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample, type DemoExamplesVariant } from '../definitions.js';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import flowbiteUiSchema from './uischema.flowbite.json' with { type: 'json' };
import skeletonUiSchema from './uischema.skeleton.json' with { type: 'json' };

export const createExtendedControlOptionsExample = (
  variant: DemoExamplesVariant,
): DemoExample => {
  const uischema =
    variant === 'flowbite'
      ? (flowbiteUiSchema as UISchemaElement)
      : (skeletonUiSchema as UISchemaElement);

  return createStaticExample({
    name: 'extended-control-options',
    label: 'Extended Control Options',
    data,
    schema: schema as JsonSchema,
    uischema,
  });
};
