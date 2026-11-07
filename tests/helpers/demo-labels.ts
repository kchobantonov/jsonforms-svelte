import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

const editorLabels: Record<string, keyof typeof messages.en> = {
  Demo: 'editor.demo.label',
  Data: 'editor.data.label',
  Schema: 'editor.schema.label',
  'UI Schema': 'editor.uiSchema.label',
  'UI Schemas': 'editor.uiSchemas.label',
  Internationalization: 'editor.i18n.label',
  Config: 'editor.config.label',
};

/** Resolve demo editor names without translating authored form labels. */
export function demoEditorLabel(locale: 'en' | 'bg', name: string): string {
  const key = editorLabels[name];
  if (!key) throw new Error(`Unknown demo editor: ${name}`);
  return messages[locale][key];
}
