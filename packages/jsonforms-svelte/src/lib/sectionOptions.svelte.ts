/** Report a deprecated flat setting once for each mounted section consumer. */
export function useLegacySectionOptionDiagnostic(
  key: 'collapsible' | 'showDataIndicator',
  usesFlatDefault: () => boolean,
) {
  let warned = false;
  $effect(() => {
    if (usesFlatDefault() && !warned) {
      warned = true;
      console.warn(
        `section.legacyFlatOption: config.${key} is deprecated; use config.jsonformsExtended.${key}.`,
      );
    }
  });
}
