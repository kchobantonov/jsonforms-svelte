import { annotateFixture } from '../annotate.js';
const schemaI18nOverrides: Record<string, string> = {
  '/properties/branchFeedback': 'branchFeedback.value',
  '/properties/branchFeedback/anyOf/0': 'branchFeedback.shortBranch',
  '/properties/branchFeedback/anyOf/0/properties/text': 'branchFeedback.text',
  '/properties/branchFeedback/anyOf/1': 'branchFeedback.longBranch',
  '/properties/branchFeedback/anyOf/1/properties/text': 'branchFeedback.text',
};

export function localizeMixedSchema(value: unknown, path = ''): unknown {
  return annotateFixture(
    value,
    (node, path) => ({
      ...(schemaI18nOverrides[path]
        ? { i18n: schemaI18nOverrides[path] }
        : typeof node.title === 'string'
          ? { i18n: node.i18n ?? `mixedExample${path}` }
          : {}),
    }),
    path,
  );
}
