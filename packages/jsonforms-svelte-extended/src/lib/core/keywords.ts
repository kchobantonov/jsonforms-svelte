import Ajv from 'ajv';
import keywords from 'ajv-keywords';
import dynamicDefaults from 'ajv-keywords/dist/definitions/dynamicDefaults';
import transform from './transform';
import { scriptEvaluationAllowed } from './buttonScript';

import {
  dateOffset,
  datetimeOffset,
  dateUnit,
  makeDynamic,
  searchParams,
  timeOffset,
} from './dynamicDefaults';

export const ajvKeywords = (ajv: Ajv, config: () => unknown = () => undefined) => {
  keywords(ajv);

  // add custom transform to be able to use more transformation functions since the transform keyword is not extensible as the dynamicDefaults
  ajv.removeKeyword('transform');
  ajv.addKeyword(transform());

  // Keep providers and permission closures local to this validator. The plugin's
  // DEFAULTS table is module-global and must never capture a form's privileges.
  const providers = {
    ...dynamicDefaults.DEFAULTS,
    dynamic: makeDynamic(() => scriptEvaluationAllowed(config())),
    searchParams,
    datetime: datetimeOffset,
    date: dateOffset,
    time: timeOffset,
    dateUnit,
  };
  ajv.removeKeyword('dynamicDefaults');
  ajv.addKeyword({
    ...dynamicDefaults(),
    compile(
      schema: Record<string, string | { func: string; args: Record<string, unknown> }>,
      _parent,
      it,
    ) {
      if (!it.opts.useDefaults || it.compositeRule) return () => true;
      const defaults = Object.entries(schema).map(([property, definition]) => {
        const name = typeof definition === 'string' ? definition : definition.func;
        const provider = Object.hasOwn(providers, name)
          ? providers[name as keyof typeof providers]
          : undefined;
        if (!provider) throw new Error(`invalid "dynamicDefaults" keyword property value: ${name}`);
        return [
          property,
          provider(typeof definition === 'string' ? undefined : definition.args),
        ] as const;
      });
      const empty = it.opts.useDefaults === 'empty';
      return (data: Record<string, unknown>) => {
        for (const [property, provide] of defaults) {
          if (
            data[property] === undefined ||
            (empty && (data[property] === null || data[property] === ''))
          ) {
            const value = provide();
            if (value !== undefined)
              Object.defineProperty(data, property, {
                value,
                enumerable: true,
                writable: true,
                configurable: true,
              });
          }
        }
        return true;
      };
    },
  });
};
