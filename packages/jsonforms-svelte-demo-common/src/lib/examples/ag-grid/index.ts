import data from './data.json';
import schema from './schema.json';
import uischema from './uischema.json';
import { createStaticExample, type DemoExample } from '../definitions.js';

export const createAgGridExample = (): DemoExample =>
  createStaticExample({
    name: 'ag-grid',
    label: 'AG Grid array renderer',
    schema,
    uischema,
    data,
  });
