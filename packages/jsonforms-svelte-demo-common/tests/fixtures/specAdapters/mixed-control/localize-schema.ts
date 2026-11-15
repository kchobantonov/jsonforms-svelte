const schemaI18nOverrides: Record<string, string> = {
  '/properties/branchFeedback': 'branchFeedback.value',
  '/properties/branchFeedback/anyOf/0': 'branchFeedback.shortBranch',
  '/properties/branchFeedback/anyOf/0/properties/text': 'branchFeedback.text',
  '/properties/branchFeedback/anyOf/1': 'branchFeedback.longBranch',
  '/properties/branchFeedback/anyOf/1/properties/text': 'branchFeedback.text',
};

export function localizeMixedSchema(value: unknown, path = ''): unknown {
  if (Array.isArray(value))
    return value.map((child, index) => localizeMixedSchema(child, `${path}/${index}`));
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  return {
    ...Object.fromEntries(
      Object.entries(node).map(([key, child]) => [
        key,
        localizeMixedSchema(child, `${path}/${key}`),
      ]),
    ),
    ...(schemaI18nOverrides[path]
      ? { i18n: schemaI18nOverrides[path] }
      : typeof node.title === 'string'
        ? { i18n: node.i18n ?? `mixedExample${path}` }
        : {}),
  };
}
