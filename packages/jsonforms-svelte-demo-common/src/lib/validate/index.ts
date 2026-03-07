import type Ajv from 'ajv';
import type { Options } from 'ajv';
import { ajvKeywords } from './keywords';

export * from './dynamicDefaults';
export * from './keywords';
export { default as transformKeywordDefinition } from './transform';

export const createDemoAjv = (createDefaultAjv: (options: Options) => Ajv): Ajv => {
  const options: Options = {
    useDefaults: true,
    $data: true,
    discriminator: true,
  };

  const ajv = createDefaultAjv(options);
  ajvKeywords(ajv);

  return ajv;
};
