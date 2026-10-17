// Adapted from array-detail-modes/uischemas.mjs at f0183923295c495c60024fddca58dbe99e82e816.
import type { JsonFormsUISchemaRegistryEntry } from '@jsonforms/core';
export const uischemas: JsonFormsUISchemaRegistryEntry[] = [
  {
    tester: (schema, schemaPath) =>
      schema?.properties?.name && schemaPath !== '#/properties/fallback' ? 10 : -1,
    uischema: {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Registered name',
      i18n: 'detailExample.registeredName',
    },
  },
];
