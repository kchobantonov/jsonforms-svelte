import type { createDemoTranslator } from '../i18n/demo';
import { appstoreLayouts, type AppstoreLayouts } from '../store/index.svelte';

export function settingsOptions(translate: ReturnType<typeof createDemoTranslator>) {
  const validationModes = [
    { name: translate('settings.validateShow'), value: 'ValidateAndShow' },
    { name: translate('settings.validateHide'), value: 'ValidateAndHide' },
    { name: translate('settings.noValidation'), value: 'NoValidation' },
  ];

  const locales = [
    { name: translate('settings.english'), value: 'en' },
    { name: translate('settings.german'), value: 'de' },
    { name: translate('settings.bulgarian'), value: 'bg' },
    {
      name: translate('settings.browserLanguage'),
      value: typeof navigator !== 'undefined' ? navigator.language : 'en',
    },
  ];

  const layoutMapping: Record<AppstoreLayouts, string> = {
    default: translate('settings.defaultLayout'),
    'demo-and-data': translate('settings.demoAndData'),
  };

  const layouts = appstoreLayouts.map((value: AppstoreLayouts) => ({
    name: layoutMapping[value] ?? value,
    value: value,
  }));
  return { validationModes, locales, layouts };
}

export function addErrorKeywords(current: readonly string[], draft: string) {
  const next = [...current];
  for (const keyword of draft.split(',').map((value) => value.trim())) {
    if (keyword && !next.includes(keyword)) next.push(keyword);
  }
  return next;
}
