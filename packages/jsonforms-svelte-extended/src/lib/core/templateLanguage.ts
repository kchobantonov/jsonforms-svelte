/** Resolve the host's declared engine without treating an unsupported value as Ractive. */
export function templateLanguage(uischema: { lang?: unknown }, config: unknown): string {
  const settings = config as { jsonformsExtended?: { defaultTemplateLang?: unknown } } | undefined;
  const language = uischema.lang ?? settings?.jsonformsExtended?.defaultTemplateLang ?? 'ractive';
  return String(language);
}
