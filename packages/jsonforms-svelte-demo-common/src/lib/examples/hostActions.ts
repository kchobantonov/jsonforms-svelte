/** Actions supplied by a demo host rather than by an individual example. */
export function resolveDemoHostAction(
  action: string,
  params: Record<string, unknown>,
  host: { setLocale: (locale: string) => void; toggleMode: () => void },
): (() => void) | undefined {
  if (action === 'changeLang' || action === 'setLocale') {
    const locale = params.locale ?? params.lang;
    return typeof locale === 'string' && locale.length > 0
      ? () => host.setLocale(locale)
      : undefined;
  }
  if (action === 'toggleMode') return host.toggleMode;
  return undefined;
}
