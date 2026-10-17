/** Resolve the host's declared engine without treating an unsupported value as Ractive. */
export function templateLanguage(uischema: { lang?: unknown }, config: unknown): string {
  const settings = config as
    | { jsonformsExtended?: { defaultTemplateLang?: unknown }; defaultTemplateLang?: unknown }
    | undefined;
  return String(
    uischema.lang ??
      settings?.jsonformsExtended?.defaultTemplateLang ??
      settings?.defaultTemplateLang ??
      'ractive',
  );
}
