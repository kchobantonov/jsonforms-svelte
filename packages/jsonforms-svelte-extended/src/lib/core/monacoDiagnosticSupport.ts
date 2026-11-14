/** Languages for which Monaco diagnostics can be read from an owned worker generation. */
export function supportsMonacoDiagnosticReader(language: string): boolean {
  return ['json', 'javascript', 'typescript', 'css', 'scss', 'less'].includes(language);
}
