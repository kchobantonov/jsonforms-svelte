import { createTranslator } from '$lib/i18n/i18n.js';
import { useAppStore } from '$lib/store/index.svelte.js';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

const appStore = useAppStore();

export default [
  {
    name: 'duration',
    label: 'Duration',
    data: data,

    schema: schema,
    uischema: uischema,
  },
];
