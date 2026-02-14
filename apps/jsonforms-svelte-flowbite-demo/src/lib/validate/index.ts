import { createAjv as createDefaultAjv } from '@chobantonov/jsonforms-svelte-flowbite';
import type { Options } from 'ajv';
import { ajvKeywords } from './keywords';

export const createAjv = () => {
  const options: Options = {
    useDefaults: true,
    $data: true,
    discriminator: true,
  };

  const ajv = createDefaultAjv(options);
  ajvKeywords(ajv);

  return ajv;
};
