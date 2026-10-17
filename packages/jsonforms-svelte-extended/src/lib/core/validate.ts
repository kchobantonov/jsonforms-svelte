import { createRendererAjv as createDefaultAjv } from '@chobantonov/jsonforms-svelte';
import type { Options } from 'ajv';
import ajvErrors from 'ajv-errors';
import { ajvTranslations } from './ajv-i18n/index.js';
import { ajvKeywords } from './keywords.js';
import type { I18nGetter } from './types.js';
import { cronProblem } from './cron';
import { isColor } from './color.js';

export const createAjv = (i18n?: I18nGetter, config: () => unknown = () => undefined) => {
  const options: Options = {
    useDefaults: true,
    $data: true,
    discriminator: true,
  };

  const ajv = createDefaultAjv(options);

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

  return ajv;
};
