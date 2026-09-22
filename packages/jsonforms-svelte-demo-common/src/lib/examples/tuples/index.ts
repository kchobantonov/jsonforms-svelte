import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import uischemas from './uischemas.json';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
export const createTuplesExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'tuples',
      label: 'Tuples (coordinates & positional records)',
      schema,
      uischema,
      data,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    {
      en: {
        tuple: { save: 'Save changes', cancel: 'Discard changes' },
        coordinates: { x: { label: 'Horizontal coordinate' }, y: { label: 'Vertical coordinate' } },
      },
      bg: {
        tuple: { save: 'Запази промените', cancel: 'Откажи промените' },
        coordinates: {
          x: { label: 'Хоризонтална координата' },
          y: { label: 'Вертикална координата' },
        },
      },
    },
    getLocale,
  );
