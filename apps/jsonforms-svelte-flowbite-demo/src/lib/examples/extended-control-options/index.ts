import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export default [
  {
    name: 'extended-control-options',
    label: 'Extended Control Options',
    data: data,
    schema: schema,
    uischema: uischema,
  },
];
