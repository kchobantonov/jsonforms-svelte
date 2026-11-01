import { createRendererAjv as createDefaultAjv } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema } from '@jsonforms/core';
import type { Options } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import { ajvTranslations } from './ajv-i18n/index.js';
import { ajvKeywords } from './keywords.js';
import type { I18nGetter } from './types.js';
import { cronProblem } from './cron';
import { isColor } from './color.js';

export const createAjv = (
  i18n?: I18nGetter,
  config: () => unknown = () => undefined,
  externalSchemas: readonly (JsonSchema | boolean)[] = [],
  dialect: 'draft-07' | 'draft-2020-12' = 'draft-07',
) => {
  const options: Options = {
    useDefaults: true,
    $data: true,
    discriminator: true,
  };

  const ajv =
    dialect === 'draft-2020-12'
      ? new Ajv2020({
          allErrors: true,
          verbose: true,
          strict: false,
          addUsedSchema: false,
          ...options,
        })
      : createDefaultAjv(options);
  if (dialect === 'draft-2020-12') addFormats(ajv);

  ajv.addFormat('cron', {
    type: 'string',
    validate: (value: string) => cronProblem(value) === undefined,
  });

  ajv.addFormat('color', {
    type: 'string',
    validate: (value: string) => isColor(value),
  });

  ajvKeywords(ajv, config);
  ajvErrors(ajv);
  ajvTranslations(ajv, { i18n });

  for (const schema of externalSchemas) ajv.addSchema(schema);

  return ajv;
};
