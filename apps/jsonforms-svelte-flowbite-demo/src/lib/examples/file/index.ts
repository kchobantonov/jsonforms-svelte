import { createTranslator } from '$lib/i18n/i18n.js';
import { useAppStore } from '$lib/store/index.svelte.js';
import data from './data.json' with { type: 'json' };
import i18n from './i18n.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

const appStore = useAppStore();

export default [
  {
    name: 'file',
    label: 'File',
    data: data,

    schema: schema,
    uischema: uischema,
    get i18n() {
      return {
        locale: appStore.jsonforms.locale.value,
        translate: createTranslator(appStore.jsonforms.locale.value, i18n),
        translations: i18n,
      };
    },
  },
];
