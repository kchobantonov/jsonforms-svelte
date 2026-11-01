/** Resolve the host's declared engine without treating an unsupported value as Ractive. */
export function templateLanguageResolution(
  uischema: { lang?: unknown },
  config: unknown,
): { language: string; legacyFlatDefault: boolean } {
  const settings = config as
    | { jsonformsExtended?: { defaultTemplateLang?: unknown }; defaultTemplateLang?: unknown }
    | undefined;
  const language =
    uischema.lang ??
    settings?.jsonformsExtended?.defaultTemplateLang ??
    settings?.defaultTemplateLang ??
    'ractive';
  return {
    language: String(language),
    legacyFlatDefault:
      uischema.lang == null &&
      settings?.jsonformsExtended?.defaultTemplateLang == null &&
      settings?.defaultTemplateLang != null,
  };
}

export function templateLanguage(uischema: { lang?: unknown }, config: unknown): string {
  return templateLanguageResolution(uischema, config).language;
}
