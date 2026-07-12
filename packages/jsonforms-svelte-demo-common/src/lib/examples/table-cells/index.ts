import data from './data.json';
import schema from './schema.json';
import uischema from './uischema.json';
import { createStaticExample, type DemoExample } from '../definitions.js';

export const createTableCellsExample = (): DemoExample =>
  createStaticExample({
    name: 'table-cells',
    label: 'Table Cells (scalar & composite)',
    schema,
    uischema,
    data,
  });
